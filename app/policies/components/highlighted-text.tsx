"use client"

import React from "react"

interface HighlightedTextProps {
  text: string
  highlight: string
}

export function HighlightedText({ text, highlight }: HighlightedTextProps) {
  if (!highlight || !text) {
    return <>{text}</>
  }

  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"))

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={index} className="bg-yellow-200 text-yellow-900 px-0.5 rounded">
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  )
}
