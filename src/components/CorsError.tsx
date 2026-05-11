// src/components/CorsError.tsx
import { Button } from "@src/components/ui/button";

export function CorsError() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <p className="text-destructive font-medium text-lg">
        You're probably logged out of MMS.
      </p>
      <Button>
        <a
          href="https://mms.st-andrews.ac.uk/mms/"
          target="_blank"
          rel="noreferrer"
          className="text-white!"
        >
          Log in to MMS
        </a>
      </Button>
    </div>
  );
}
