// 데이터 저장소 (현재: 브라우저 localStorage)
// 나중에 Supabase / Firebase 로 옮길 때 이 파일만 바꾸면 되도록 분리해 둠.

const KEY_MEMBERS = 'mym.members.v1';
const KEY_RECORDS = 'mym.records.v1';

const SEED = [
  '공민호', '공민호(아들)', '이지영', '신정', '김홍', '김현범', '임진택',
  '문명국', '문명국(아들)', '백상희', '김종현', '김종현(딸)', '이지현',
  '이명노', '이균봉', '도승남', '권소현', '서정우', '사공명숙', '문제영',
];

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/** "문명국(아들)" -> { base: "문명국", tag: "아들" } */
export function parseName(name) {
  const m = /^(.+?)\s*\((.+)\)\s*$/.exec(name.trim());
  return m ? { base: m[1].trim(), tag: m[2].trim() } : { base: name.trim(), tag: '' };
}

/** 이름이 "보호자이름(관계)" 형태이면 보호자 멤버 id 를 찾아 줌 */
export function guessParentId(name, members, selfId) {
  const { base, tag } = parseName(name);
  if (!tag) return null;
  const p = members.find((m) => m.id !== selfId && !m.parentId && m.name.trim() === base);
  return p ? p.id : null;
}

function seedMembers() {
  const list = SEED.map((name, i) => ({ id: 'm' + (i + 1), name, parentId: null }));
  list.forEach((m) => { m.parentId = guessParentId(m.name, list, m.id); });
  return list;
}

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장 불가(사생활 보호 모드 등) — 화면은 계속 동작 */
  }
}

export const loadMembers = () => read(KEY_MEMBERS) ?? seedMembers();
export const saveMembers = (members) => write(KEY_MEMBERS, members);
export const loadRecords = () => read(KEY_RECORDS) ?? {};
export const saveRecords = (records) => write(KEY_RECORDS, records);
