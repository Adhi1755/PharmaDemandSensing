export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
            <p className="text-sm text-slate-500 font-medium">{text}</p>
        </div>
    );
}
