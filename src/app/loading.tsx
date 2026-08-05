import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#FAFAFA]">
      <div className="flex flex-col items-center space-y-4">
        <span className="font-serif text-3xl font-extrabold tracking-widest text-gray-900 animate-pulse">
          LUXORA
        </span>
        <div className="w-12 h-0.5 bg-black rounded-full animate-bounce"></div>
      </div>
    </div>
  );
}
