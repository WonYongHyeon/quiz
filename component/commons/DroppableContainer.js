import { useDroppable, useDraggable } from "@dnd-kit/core";

// 드래그 가능한 카드 컴포넌트
function DraggableCard({ id, data }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  // transform을 이용해 드래그 시 카드가 부드럽게 따라오도록 함
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        boxShadow: "0 5px 15px rgba(0,0,0,0.1)", // 드래그 중 그림자 효과
        zIndex: 10, // 다른 카드 위로 올라오도록 함
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: "12px",
        margin: "8px 0",
        backgroundColor: "white",
        border: "1px solid #eee",
        borderRadius: "4px",
        cursor: "grab",
        ...style,
      }}
      {...attributes}
      {...listeners}
    >
      <p style={{ margin: 0, fontWeight: "bold" }}>{data.nickname}</p>
      <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#555" }}>
        제출 답안: {data.answer || "미제출"}
      </p>
    </div>
  );
}

// 아이템을 내려놓을 수 있는 컨테이너 컴포넌트
export default function DroppableContainer({
  id,
  title,
  nicks,
  allParticipants,
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: id, // 이 컨테이너의 고유 ID ('correct-group', 'incorrect-group')
  });

  // 드래그 중인 카드가 이 컨테이너 위에 올라왔을 때 배경색 변경
  const style = {
    backgroundColor: isOver ? "#e0f7fa" : "#f4f4f4",
    minHeight: "200px",
    width: "50%",
    padding: "16px",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    transition: "background-color 0.2s ease",
  };

  return (
    <div ref={setNodeRef} style={style}>
      <h2
        style={{
          marginTop: 0,
          borderBottom: "1px solid #ddd",
          paddingBottom: "8px",
        }}
      >
        {title}
      </h2>

      {/* nicks 배열을 기반으로 참가자 정보를 찾아 DraggableCard를 렌더링 */}
      {nicks.map((nickname) => {
        const participantData = allParticipants[nickname];
        if (!participantData) return null; // 데이터가 없으면 렌더링하지 않음

        return (
          <DraggableCard
            key={nickname}
            id={nickname} // Draggable의 고유 ID는 닉네임
            data={{ nickname, ...participantData }}
          />
        );
      })}
    </div>
  );
}
