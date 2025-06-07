"use client"

import type React from "react"
import { useState, memo } from "react"
import { ComposableMap, Geographies, Geography, Sphere, Graticule, ZoomableGroup } from "react-simple-maps"
import { Tooltip as ReactTooltip } from "react-tooltip"
import type { StateImplementationProgress } from "../actions" // Adjust path as needed

// Using a publicly available GeoJSON for India states
const INDIA_GEO_URL = "https://raw.githubusercontent.com/markmarkoh/datamaps/master/src/js/data/ind.topojson"

interface InteractiveMapIndiaProps {
  data: StateImplementationProgress[]
}

const getProgressColor = (progress: number): string => {
  if (progress >= 75) return "#22c55e" // green-500
  if (progress >= 50) return "#84cc16" // lime-500
  if (progress >= 25) return "#facc15" // yellow-400
  if (progress > 0) return "#fb923c" // orange-400
  return "#e5e7eb" // gray-200
}

// Rename the component function
const InteractiveMapIndiaComponent: React.FC<InteractiveMapIndiaProps> = ({ data }) => {
  const [tooltipContent, setTooltipContent] = useState("")

  const dataMap = new Map(data.map((item) => [item.name, item]))

  return (
    <>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 800,
          center: [82, 22], // Approximate center of India
        }}
        style={{ width: "100%", height: "auto" }}
        data-tip=""
      >
        <ZoomableGroup center={[82, 22]} zoom={1}>
          <Sphere stroke="#E4E5E6" strokeWidth={0.5} id="sphere" />
          <Graticule stroke="#E4E5E6" strokeWidth={0.5} />
          <Geographies geography={INDIA_GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateName = geo.properties.name
                const stateData = dataMap.get(stateName)
                const progress = stateData?.value || 0
                const policiesTracked = stateData?.policiesTracked || 0
                const color = getProgressColor(progress)

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={() => {
                      setTooltipContent(
                        `<strong>${stateName}</strong><br />Progress: ${progress}%<br />Policies Tracked: ${policiesTracked}`,
                      )
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("")
                    }}
                    style={{
                      default: {
                        fill: color,
                        outline: "none",
                        stroke: "#606060",
                        strokeWidth: 0.3,
                      },
                      hover: {
                        fill: color,
                        outline: "none",
                        stroke: "#303030",
                        strokeWidth: 0.75,
                      },
                      pressed: {
                        fill: color,
                        outline: "none",
                      },
                    }}
                  />
                )
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      {tooltipContent && <ReactTooltip id="map-tooltip" html={tooltipContent} place="top" effect="solid" />}
    </>
  )
}

// Replace the default export:
// export default memo(InteractiveMapIndia)
// With a named export:
export const InteractiveMapIndia = memo(InteractiveMapIndiaComponent)
