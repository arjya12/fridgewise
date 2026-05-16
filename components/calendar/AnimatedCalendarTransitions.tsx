import React from "react";

interface AnimatedCalendarTransitionsProps {
  children?: React.ReactNode;
  preset?: "smooth" | "gentle" | string;
}

const AnimatedCalendarTransitions: React.FC<
  AnimatedCalendarTransitionsProps
> = ({ children }) => {
  return <>{children}</>;
};

export default AnimatedCalendarTransitions;



