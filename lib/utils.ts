import { createCn } from "cn/config"

/**
 * 클래스 병합. 우리 글자 크기 토큰(text-body 등)을 색(text-brand-900)과
 * 다른 그룹으로 인식하도록 등록한다.
 */
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "title", "subtitle", "body", "caption", "time"] },
      ],
      shadow: [{ shadow: ["pop", "card"] }],
    },
  },
})
