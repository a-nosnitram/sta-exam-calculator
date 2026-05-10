import { Button } from "@src/components/ui/button";

export default function Popup() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">STA Exam Calculator</h1>

      <Button
        onClick={() => {
          alert("clicked");
        }}
      >
        Calculate grades
      </Button>
    </div>
  );
}
