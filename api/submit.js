// api/submit.js
// 강릉 우미 린 더 프리미어는 분양이 종료되어 상담 접수를 닫았다.
// 들어온 요청은 대시보드·텔레그램 어디로도 보내지 않고 거절한다.
// (화면에는 "접수에 실패했습니다 … 대표번호로 연락" 안내가 뜬다.)

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  return res.status(410).json({ error: '상담 접수가 종료되었습니다.' });
}
