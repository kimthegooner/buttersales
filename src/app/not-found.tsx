import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="text-2xl font-bold text-white mb-2">페이지를 찾을 수 없습니다</h2>
      <p className="text-[#a78bbc] mb-6">요청하신 페이지가 존재하지 않습니다.</p>
      <Link
        href="/pipeline"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
      >
        파이프라인으로 이동
      </Link>
    </div>
  )
}
