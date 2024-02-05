"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

function TruncatedParagraph({ text }: { text: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const [maxHeight, setMaxHeight] = useState("10rem");
  const [scrollHeight, setScrollHeight] = useState(0);

  const textRef = useCallback((node) => {
    if (node !== null) {
      setScrollHeight(node.scrollHeight);
      if (node.scrollHeight > node.offsetHeight) {
        setShowReadMore(true);
      } else {
        setShowReadMore(false);
      }
    }
  }, []);

  //   useEffect(() => {
  //     // if (!textRef.current) return;
  //     if (textRef.current.clientHeight !== textRef.current.scrollHeight) {
  //       setShowReadMore(true);
  //     }
  //   }, []);

  const toggleExpanded = () => {
    // if (!textRef.current) return;
    if (!isExpanded) {
      // Expand the paragraph
      setMaxHeight(`${scrollHeight}px`);
    } else {
      // Collapse the paragraph
      setMaxHeight("10rem");
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      <div
        ref={textRef}
        style={{ maxHeight }}
        className={`relative overflow-hidden transition-all duration-500 ease-in-out`}
      >
        <p className="mb-4">{text}</p>
        {showReadMore && !isExpanded && (
          <div className="from-background pointer-events-none absolute bottom-0 left-0 h-6 w-full bg-gradient-to-t to-transparent"></div>
        )}
        {showReadMore && (
          <button
            onClick={toggleExpanded}
            className="bg-background absolute bottom-0 right-0 px-2 text-blue-500"
          >
            {isExpanded ? "Collapse" : "Read more"}
          </button>
        )}
      </div>
    </div>
  );
}

export default TruncatedParagraph;
