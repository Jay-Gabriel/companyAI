type TodoSummaryProps = {
  total: number;
  remaining: number;
  completed: number;
};

export default function TodoSummary({ total, remaining, completed }: TodoSummaryProps) {
  return (
    <dl className="grid grid-cols-3 gap-2 text-center sm:w-72">
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-normal text-slate-500">Total</dt>
        <dd className="text-xl font-semibold">{total}</dd>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-normal text-slate-500">Open</dt>
        <dd className="text-xl font-semibold">{remaining}</dd>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
        <dt className="text-xs font-medium uppercase tracking-normal text-slate-500">Done</dt>
        <dd className="text-xl font-semibold">{completed}</dd>
      </div>
    </dl>
  );
}
