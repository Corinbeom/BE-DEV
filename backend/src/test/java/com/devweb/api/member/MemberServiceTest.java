package com.devweb.api.member;

import com.devweb.common.ResourceNotFoundException;
import com.devweb.domain.member.model.Member;
import com.devweb.domain.member.port.MemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.BDDMockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock MemberRepository memberRepository;

    @InjectMocks MemberService sut;

    @Test
    @DisplayName("이메일로 회원 생성 성공")
    void create_성공() {
        // given
        Member saved = new Member("user@example.com");
        given(memberRepository.save(any(Member.class))).willReturn(saved);

        // when
        Member result = sut.create("user@example.com");

        // then
        assertThat(result.getEmail()).isEqualTo("user@example.com");
        then(memberRepository).should().save(any(Member.class));
    }

    @Test
    @DisplayName("회원 조회 성공")
    void get_성공() {
        // given
        Member member = new Member("user@example.com");
        given(memberRepository.findById(1L)).willReturn(Optional.of(member));

        // when
        Member result = sut.get(1L);

        // then
        assertThat(result.getEmail()).isEqualTo("user@example.com");
    }

    @Test
    @DisplayName("존재하지 않는 ID 조회 시 ResourceNotFoundException")
    void get_없으면_예외() {
        given(memberRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> sut.get(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }
}
