package com.devweb.infra.persistence.studyquiz.bank;

import com.devweb.domain.studyquiz.bank.model.CsQuestionBankItem;
import com.devweb.domain.studyquiz.session.model.CsQuizDifficulty;
import com.devweb.domain.studyquiz.session.model.CsQuizTopic;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CsQuestionBankSeeder implements ApplicationRunner {

    private final SpringDataCsQuestionBankJpaRepository repo;

    public CsQuestionBankSeeder(SpringDataCsQuestionBankJpaRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (repo.count() > 0) return;

        // MVP: MID 난이도에 대해 토픽별 최소 1개(객)+1개(주)만 준비하고, 부족분은 LLM fallback으로 채운다.
        List<CsQuestionBankItem> items = List.of(
                // OS
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.OS,
                        CsQuizDifficulty.MID,
                        "다음 중 교착상태(Deadlock) 발생의 4가지 필요 조건에 해당하지 않는 것은?",
                        List.of("상호 배제", "점유 및 대기", "선점 가능", "순환 대기"),
                        2,
                        "Deadlock의 필요 조건은 상호 배제, 점유 및 대기, 비선점, 순환 대기이다. '선점 가능'은 반대 개념이다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.OS,
                        CsQuizDifficulty.MID,
                        "프로세스와 스레드의 차이를 설명하고, 컨텍스트 스위칭 비용이 커지는 이유를 2가지 이상 들어보세요.",
                        List.of("주소 공간", "스택", "PCB/TCB", "컨텍스트 스위칭", "캐시 미스"),
                        "프로세스는 독립 주소 공간을 가지며 스레드는 프로세스 내 자원을 공유한다. 컨텍스트 스위칭은 레지스터/스케줄링 정보 저장/복원, 캐시/TCB/페이지 테이블 관련 비용 등으로 인해 비용이 든다."
                ),

                // NETWORK
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.NETWORK,
                        CsQuizDifficulty.MID,
                        "TCP 3-way handshake의 목적에 가장 가까운 것은?",
                        List.of("암호화 키 교환", "연결 수립 및 초기 시퀀스 번호 동기화", "라우팅 경로 최적화", "혼잡 제어 파라미터 교환"),
                        1,
                        "TCP handshake는 연결 수립을 확인하고 초기 시퀀스 번호(ISN)를 동기화하는 과정이다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.NETWORK,
                        CsQuizDifficulty.MID,
                        "HTTP/1.1 keep-alive의 이점과, 과도한 keep-alive가 서버에 줄 수 있는 부담을 설명해보세요.",
                        List.of("연결 재사용", "handshake 비용", "커넥션 풀", "리소스 점유", "타임아웃"),
                        "연결 재사용으로 handshake/RTT 비용이 줄어 지연이 감소한다. 반면 유휴 연결이 많아지면 FD/메모리 등 서버 자원을 점유하고, 부하가 커질 수 있다."
                ),

                // DB
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.DB,
                        CsQuizDifficulty.MID,
                        "ACID 중 '트랜잭션이 성공하면 결과가 영구히 반영되어야 한다'는 성질은?",
                        List.of("Atomicity", "Consistency", "Isolation", "Durability"),
                        3,
                        "Durability(영속성)은 커밋된 결과가 장애에도 보존되어야 함을 의미한다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.DB,
                        CsQuizDifficulty.MID,
                        "인덱스가 조회 성능을 높이는 원리와, 인덱스가 오히려 성능을 떨어뜨릴 수 있는 상황을 설명해보세요.",
                        List.of("B-Tree", "선택도", "쓰기 비용", "커버링 인덱스", "페이지 분할"),
                        "인덱스는 탐색 비용을 줄이고(예: B-Tree), 랜덤 I/O를 줄여 조회를 빠르게 한다. 하지만 인덱스가 많으면 INSERT/UPDATE/DELETE 시 유지 비용이 증가하고, 선택도가 낮으면 인덱스 스캔이 비효율적일 수 있다."
                ),

                // SPRING
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.SPRING,
                        CsQuizDifficulty.MID,
                        "Spring에서 싱글톤 스코프 빈의 기본 라이프사이클에 대한 설명으로 옳은 것은?",
                        List.of("요청마다 새로 생성된다", "컨테이너 시작 시 생성되고 컨테이너 종료 시 소멸될 수 있다", "스레드마다 1개씩 생성된다", "세션마다 1개씩 생성된다"),
                        1,
                        "기본 스코프인 singleton은 컨테이너가 관리하며 생성/소멸 시점은 컨테이너 라이프사이클에 따른다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.SPRING,
                        CsQuizDifficulty.MID,
                        "AOP가 필요한 이유를 '횡단 관심사' 관점에서 설명하고, 프록시 기반 AOP의 한계 1가지를 들어보세요.",
                        List.of("횡단 관심사", "프록시", "메서드 호출", "자기 호출", "final"),
                        "로깅/트랜잭션/보안 같은 공통 관심사를 분리해 중복을 줄이고 일관성을 높인다. 프록시 기반은 자기 호출 시 적용되지 않거나 final/private 제약 등 한계가 있다."
                ),

                // JAVA
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.JAVA,
                        CsQuizDifficulty.MID,
                        "HashMap의 키로 사용할 객체에 대해 올바른 설명은?",
                        List.of("equals만 구현하면 된다", "hashCode만 구현하면 된다", "equals와 hashCode를 함께 일관되게 구현해야 한다", "toString을 구현해야 한다"),
                        2,
                        "Hash 기반 컬렉션은 hashCode/equals 계약을 전제로 동작한다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.JAVA,
                        CsQuizDifficulty.MID,
                        "GC가 필요한 이유와, stop-the-world(STW)가 애플리케이션에 미치는 영향을 설명해보세요.",
                        List.of("메모리 누수 방지", "가비지", "STW", "지연", "Throughput"),
                        "GC는 미사용 객체를 회수해 메모리를 재사용 가능하게 한다. STW 동안 애플리케이션 스레드가 멈춰 지연이 증가하며, tail latency에 악영향을 준다."
                ),

                // DATA_STRUCTURE
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.DATA_STRUCTURE,
                        CsQuizDifficulty.MID,
                        "스택(Stack)의 대표적인 사용 사례로 가장 적절한 것은?",
                        List.of("BFS", "재귀 호출(콜 스택)", "최단 경로(Dijkstra)", "해시 인덱싱"),
                        1,
                        "스택은 LIFO 구조로, 재귀 호출/되돌리기(undo) 등에 사용된다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.DATA_STRUCTURE,
                        CsQuizDifficulty.MID,
                        "해시 테이블에서 충돌(collision)을 해결하는 방법 2가지를 설명하고 장단점을 비교해보세요.",
                        List.of("체이닝", "오픈 어드레싱", "로드 팩터", "리해시"),
                        "체이닝은 버킷에 리스트를 두어 충돌을 처리해 구현이 단순하지만 추가 포인터/메모리가 든다. 오픈 어드레싱은 배열 내에서 탐사를 통해 저장해 캐시 효율이 좋을 수 있으나 로드 팩터가 높아지면 성능이 급격히 저하될 수 있다."
                ),

                // ALGORITHM
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.ALGORITHM,
                        CsQuizDifficulty.MID,
                        "다익스트라(Dijkstra) 알고리즘이 올바르게 동작하기 위한 조건은?",
                        List.of("음수 가중치가 없어야 한다", "그래프가 반드시 DAG여야 한다", "간선이 반드시 무방향이어야 한다", "정점 수가 100 이하여야 한다"),
                        0,
                        "Dijkstra는 음수 가중치가 있으면 최단거리 확정 과정이 깨질 수 있다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.ALGORITHM,
                        CsQuizDifficulty.MID,
                        "시간 복잡도와 공간 복잡도의 차이를 설명하고, 빅오 표기법이 실제 성능을 설명하지 못하는 예 1가지를 들어보세요.",
                        List.of("빅오", "상수항", "캐시", "입력 분포", "실측"),
                        "시간/공간 복잡도는 입력 크기에 따른 연산/메모리 성장률을 나타낸다. 빅오는 상수항/하드웨어/캐시/입력 분포를 무시하므로, 같은 O(n)이라도 상수항이나 캐시 친화성에 따라 실제 성능이 크게 달라질 수 있다."
                ),

                // ARCHITECTURE
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.ARCHITECTURE,
                        CsQuizDifficulty.MID,
                        "CQRS 패턴에 대한 설명으로 가장 적절한 것은?",
                        List.of("읽기/쓰기 모델을 분리해 각각 최적화한다", "모든 트랜잭션을 2PC로 처리한다", "항상 이벤트 소싱을 필수로 한다", "캐시를 쓰지 않는다"),
                        0,
                        "CQRS는 Command/Query 책임을 분리해 모델/스토리지를 최적화할 수 있다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.ARCHITECTURE,
                        CsQuizDifficulty.MID,
                        "이벤트 기반 아키텍처에서 at-least-once 전달 방식이 가져오는 문제와, 이를 완화하는 방법을 설명해보세요.",
                        List.of("중복 처리", "멱등성", "디듀플리케이션", "재시도", "오프셋"),
                        "at-least-once는 중복 메시지로 인한 중복 처리가 문제다. 멱등 처리, 중복 키 저장/디듀플리케이션, 트랜잭션 아웃박스 등으로 완화할 수 있다."
                ),

                // CLOUD
                CsQuestionBankItem.multipleChoice(
                        CsQuizTopic.CLOUD,
                        CsQuizDifficulty.MID,
                        "오토 스케일링(Auto Scaling)의 주된 목적에 가장 가까운 것은?",
                        List.of("암호화 강화", "비용을 0으로 만든다", "트래픽 변화에 맞춰 리소스를 탄력적으로 조절한다", "DB 정규화를 자동화한다"),
                        2,
                        "오토 스케일링은 수요 변화에 따라 인스턴스/파드를 늘리거나 줄여 가용성과 비용 효율을 맞춘다."
                ),
                CsQuestionBankItem.shortAnswer(
                        CsQuizTopic.CLOUD,
                        CsQuizDifficulty.MID,
                        "VPC에서 서브넷을 분리(퍼블릭/프라이빗)하는 이유와, 보안그룹과 NACL의 차이를 설명해보세요.",
                        List.of("서브넷", "퍼블릭", "프라이빗", "보안그룹", "NACL"),
                        "퍼블릭/프라이빗 분리로 외부 노출 자원과 내부 자원을 격리해 공격 표면을 줄인다. 보안그룹은 인스턴스 단위의 상태 저장(stateful) 필터, NACL은 서브넷 단위의 상태 비저장(stateless) 필터로 볼 수 있다."
                )
        );

        repo.saveAll(items);
    }
}

