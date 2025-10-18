export default function Card({ children, className='' }) {
  return <div className={`bg-white p-6 rounded-2xl shadow-xl border border-gray-100 ${className}`}>{children}</div>;
}
