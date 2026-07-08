export default function LoadingSpinner() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-route-light border-t-route" />
        <p className="text-sm font-medium text-ink">Загружаем...</p>
      </div>
    </div>
  );
}
