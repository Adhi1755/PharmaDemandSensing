export default function LoadingSpinner({ text = "Loading..." }: { text?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-10 h-10 border-3 border-[rgba(255,255,255,0.12)] border-t-[var(--color-primary)] rounded-full animate-spin"></div>
            <p className="text-sm text-[rgba(191,191,191,1)] font-medium">{text}</p>
        </div>
    );
}
