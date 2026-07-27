const WaitingpageContainer = ({ children, title }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-8 w-full max-w-md">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <img
            src="/moscot.png"
            alt="Logo"
            height={120}
            width={120}
            className="mb-4"
          />

          {/* Subtitle */}
          <p className="text-sm uppercase tracking-widest mb-6 text-muted-foreground">
            Shothik AI
          </p>

          {/* Main Heading */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-normal text-foreground mb-2">
              Join the waitlist for the
            </h1>
            <h2
              className="text-4xl sm:text-5xl font-bold text-primary"
            >
              {title}
            </h2>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default WaitingpageContainer;
