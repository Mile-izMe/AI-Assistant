import { useEffect, useState, RefObject, useRef } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";

interface HandState {
  x: number;
  y: number;
  isPinching: boolean;
  isActive: boolean;
}

export const useHandTracking = (
  videoRef: RefObject<HTMLVideoElement | null>,
) => {
  const [handState, setHandState] = useState<HandState>({
    x: 0,
    y: 0,
    isPinching: false,
    isActive: false,
  });

  // Lưu lại trạng thái của khung hình trước đó để so sánh
  const wasPinchingRef = useRef(false);
  // Lưu lại cái Thẻ (Card) mà ngón tay đang cầm
  const grabbedElementRef = useRef<Element | null>(null);

  useEffect(() => {
    let handLandmarker: HandLandmarker;
    let animationFrameId: number;

    const initializeMediaPipe = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
      );
      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
      predictWebcam();
    };

    const predictWebcam = () => {
      if (
        videoRef.current &&
        videoRef.current.readyState >= 2 &&
        handLandmarker
      ) {
        const startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(
          videoRef.current,
          startTimeMs,
        );

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          const indexTip = landmarks[8];
          const thumbTip = landmarks[4];

          // Ánh xạ tọa độ màn hình
          const screenX = (1 - indexTip.x) * window.innerWidth;
          const screenY = indexTip.y * window.innerHeight;

          // Tính khoảng cách ngón tay
          const distance = Math.sqrt(
            Math.pow(indexTip.x - thumbTip.x, 2) +
              Math.pow(indexTip.y - thumbTip.y, 2) +
              Math.pow(indexTip.z - thumbTip.z, 2),
          );

          const isPinching = distance < 0.05;

          // --- LOGIC PHÁT SỰ KIỆN CHUỘT (MAGIC HAPPENS HERE) ---
          const wasPinching = wasPinchingRef.current;

          if (isPinching && !wasPinching) {
            // Vừa mới chụm tay -> TÌM XEM ĐANG CẦM VÀO CÁI GÌ
            // Ẩn con trỏ ảo đi 1 miligiây để lấy được Element nằm bên dưới nó
            const el = document.elementFromPoint(screenX, screenY);
            if (el) {
              grabbedElementRef.current = el;
              // Bắn lệnh CLICK
              el.dispatchEvent(
                new PointerEvent("pointerdown", {
                  bubbles: true,
                  clientX: screenX,
                  clientY: screenY,
                  button: 0,
                }),
              );
            }
          } else if (isPinching && wasPinching) {
            // Đang giữ và kéo -> DI CHUYỂN
            if (grabbedElementRef.current) {
              grabbedElementRef.current.dispatchEvent(
                new PointerEvent("pointermove", {
                  bubbles: true,
                  clientX: screenX,
                  clientY: screenY,
                }),
              );
            }
          } else if (!isPinching && wasPinching) {
            // Thả tay ra -> DROP
            if (grabbedElementRef.current) {
              grabbedElementRef.current.dispatchEvent(
                new PointerEvent("pointerup", {
                  bubbles: true,
                  clientX: screenX,
                  clientY: screenY,
                }),
              );
              grabbedElementRef.current = null;
            }
          }

          // Cập nhật ref cho vòng lặp tiếp theo
          wasPinchingRef.current = isPinching;
          // ----------------------------------------------------

          setHandState({ x: screenX, y: screenY, isPinching, isActive: true });
        } else {
          setHandState((prev) => ({ ...prev, isActive: false }));
          // Nếu mất nhận diện tay khi đang cầm đồ -> Thả đồ ra cho an toàn
          if (wasPinchingRef.current && grabbedElementRef.current) {
            grabbedElementRef.current.dispatchEvent(
              new PointerEvent("pointerup", { bubbles: true }),
            );
            grabbedElementRef.current = null;
            wasPinchingRef.current = false;
          }
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    initializeMediaPipe();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (handLandmarker) handLandmarker.close();
    };
  }, [videoRef]);

  return handState;
};
