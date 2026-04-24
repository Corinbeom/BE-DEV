package com.devweb.api.studyquiz.bank;

import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.bank.port.CsQuestionBankRepository;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizQuestionType;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.IOException;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class CsBankLoaderServiceTest {

    @Mock CsQuestionBankRepository bankRepository;

    @InjectMocks CsBankLoaderService sut;

    // ObjectMapper는 실제 인스턴스로 주입 (JSON 파싱 실제 수행)
    {
        // @InjectMocks 이후 ObjectMapper를 실제 인스턴스로 교체
    }

    private CsBankLoaderService sutWithRealMapper() {
        return new CsBankLoaderService(bankRepository, new ObjectMapper());
    }

    // ─────────────────────────────────────────────
    // 정상 케이스
    // ─────────────────────────────────────────────

    @Test
    @DisplayName("seed 파일에서 유효한 문제를 읽어 삽입 — countBy=0이면 저장")
    void load_성공_신규문제_삽입() throws IOException {
        // given: 테스트 cs-bank-seed.json 에서 OS/LOW/MC 1개, OS/LOW/SA 1개 유효
        // countBy = 0 이므로 TARGET_PER_COMBO(10) 개 필요
        given(bankRepository.countBy(eq(CsQuizTopic.OS), eq(CsQuizDifficulty.LOW), eq(CsQuizQuestionType.MULTIPLE_CHOICE))).willReturn(0);
        given(bankRepository.countBy(eq(CsQuizTopic.OS), eq(CsQuizDifficulty.LOW), eq(CsQuizQuestionType.SHORT_ANSWER))).willReturn(0);

        CsBankLoaderService service = sutWithRealMapper();

        // when
        CsBankLoaderService.LoadResult result = service.load();

        // then: MC 1개(choices=null인 건 제외), SA 1개 삽입 → inserted=2
        //       UNKNOWN_TOPIC 1개 → 스킵, OS/LOW/MC choices=null → 변환 실패 (inserted 에서 제외)
        assertThat(result.inserted()).isEqualTo(2);
        then(bankRepository).should(times(2)).saveAll(anyList());
    }

    @Test
    @DisplayName("이미 TARGET에 도달한 조합은 저장 스킵")
    void load_성공_이미충분한경우_스킵() throws IOException {
        // given: countBy가 TARGET_PER_COMBO(10) 이상이면 skip
        given(bankRepository.countBy(any(), any(), any())).willReturn(10);

        CsBankLoaderService service = sutWithRealMapper();

        // when
        CsBankLoaderService.LoadResult result = service.load();

        // then: saveAll 호출 없음
        assertThat(result.inserted()).isZero();
        then(bankRepository).should(never()).saveAll(anyList());
    }

    @Test
    @DisplayName("seed에 알 수 없는 enum 값이 있어도 예외 없이 스킵 처리")
    void load_성공_알수없는enum값_스킵() throws IOException {
        // given: OS/LOW/MC 는 저장, UNKNOWN_TOPIC 은 enum 파싱 실패로 스킵
        given(bankRepository.countBy(eq(CsQuizTopic.OS), eq(CsQuizDifficulty.LOW), eq(CsQuizQuestionType.MULTIPLE_CHOICE))).willReturn(0);
        given(bankRepository.countBy(eq(CsQuizTopic.OS), eq(CsQuizDifficulty.LOW), eq(CsQuizQuestionType.SHORT_ANSWER))).willReturn(0);

        CsBankLoaderService service = sutWithRealMapper();

        // when & then: 예외 없이 정상 완료
        assertThatCode(() -> service.load()).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("MC 문제에 choices가 null이면 해당 문항만 스킵, 나머지는 저장")
    void load_성공_choices없는MC_스킵() throws IOException {
        // given: seed 파일에 choices=null 인 MC 가 하나 있음
        given(bankRepository.countBy(eq(CsQuizTopic.OS), eq(CsQuizDifficulty.LOW), eq(CsQuizQuestionType.MULTIPLE_CHOICE))).willReturn(0);
        given(bankRepository.countBy(eq(CsQuizTopic.OS), eq(CsQuizDifficulty.LOW), eq(CsQuizQuestionType.SHORT_ANSWER))).willReturn(0);

        CsBankLoaderService service = sutWithRealMapper();

        // when
        CsBankLoaderService.LoadResult result = service.load();

        // then: choices 있는 MC 1개 + SA 1개 = inserted 2
        assertThat(result.inserted()).isEqualTo(2);
    }

    @Test
    @DisplayName("SaveAll 호출 시 저장되는 MC 아이템 내용 검증")
    @SuppressWarnings("unchecked")
    void load_MC아이템_내용검증() throws IOException {
        // given
        given(bankRepository.countBy(eq(CsQuizTopic.OS), eq(CsQuizDifficulty.LOW), eq(CsQuizQuestionType.MULTIPLE_CHOICE))).willReturn(0);
        given(bankRepository.countBy(eq(CsQuizTopic.OS), eq(CsQuizDifficulty.LOW), eq(CsQuizQuestionType.SHORT_ANSWER))).willReturn(0);

        CsBankLoaderService service = sutWithRealMapper();
        ArgumentCaptor<List<CsQuestionBankItem>> captor = ArgumentCaptor.forClass(List.class);

        // when
        service.load();

        // then: 첫 번째 saveAll 호출(MC)에서 correctChoiceIndex=0 확인
        then(bankRepository).should(times(2)).saveAll(captor.capture());
        List<CsQuestionBankItem> mcItems = captor.getAllValues().get(0);
        assertThat(mcItems).isNotEmpty();
        assertThat(mcItems.get(0).getPrompt()).isEqualTo("운영체제의 역할은?");
        assertThat(mcItems.get(0).getCorrectChoiceIndex()).isZero();
    }
}
