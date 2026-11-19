/**
 * 가입 입력 규칙 (F1-1): 길이 제한과 사용할 수 있는 문자 제한.
 * 백엔드(user/UserRules.java)와 같은 규칙이다. 중복 확인은 서버가 한다.
 */
export const AUTH_RULES = {
  loginId: {
    topic: "아이디는",
    target: "아이디에는",
    min: 4,
    max: 16,
    pattern: /^[a-z0-9_]+$/,
    chars: "영문 소문자, 숫자, 밑줄(_)",
    help: "영문 소문자, 숫자, 밑줄(_) 4~16자",
  },
  nickname: {
    topic: "닉네임은",
    target: "닉네임에는",
    min: 2,
    max: 10,
    pattern: /^[가-힣a-zA-Z0-9]+$/,
    chars: "한글, 영문, 숫자",
    help: "한글, 영문, 숫자 2~10자 (특수문자 불가)",
  },
  password: {
    topic: "비밀번호는",
    target: "비밀번호에는",
    min: 8,
    max: 20,
    pattern: /^[A-Za-z0-9!@#$%^&*]+$/,
    chars: "영문, 숫자, 특수문자(!@#$%^&*)",
    help: "영문, 숫자, 특수문자(!@#$%^&*) 8~20자",
  },
} as const

type Rule = (typeof AUTH_RULES)[keyof typeof AUTH_RULES]

/**
 * 어긋난 규칙 하나를 문장으로 돌려준다. 맞으면 null.
 * 검사 순서: 1) 쓸 수 없는 문자 2) 길이.
 * (쓸 수 없는 문자는 몇 글자를 치든 틀린 것이라 먼저 알려준다)
 */
function checkRule(value: string, rule: Rule): string | null {
  if (value.length > 0 && !rule.pattern.test(value)) {
    return `${rule.target} ${rule.chars}만 사용할 수 있습니다.`
  }
  if (value.length < rule.min || value.length > rule.max) {
    return `${rule.topic} ${rule.min}자 이상 ${rule.max}자 이하여야 합니다.`
  }
  return null
}

export function validateLoginId(value: string): string | null {
  return checkRule(value, AUTH_RULES.loginId)
}

export function validateNickname(value: string): string | null {
  return checkRule(value, AUTH_RULES.nickname)
}

export function validatePassword(value: string): string | null {
  return checkRule(value, AUTH_RULES.password)
}
