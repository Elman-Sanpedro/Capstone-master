export default function AppLogo() {
    return (
        <>
            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-12 items-center justify-center rounded-full overflow-hidden">
                <img
                    src="/images/LOGO.jpg"
                    alt="Mejeck Ice Plant Logo"
                    className="size-12 object-cover"
                />
            </div>
            {/* Smaller on mobile: at text-lg, "Mejeck Ice Plant" was getting
                truncated to "Mejeck Ice Pla…" once the notification bell and
                avatar also had to fit in the same narrow header bar. */}
            <div className="ml-2 grid flex-1 text-left text-sm sm:text-lg">
                <span className="mb-0.5 truncate leading-none font-semibold">Mejeck Ice Plant</span>
            </div>
        </>
    );
}
