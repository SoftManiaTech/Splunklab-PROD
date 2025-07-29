"use client"

import Salesiq from "@/components/salesiq"
import LabManagerClient from "@/components/LabManagerApp-embed/LabManagerClient" // Import the new client component

export default function LabPage() {
  return (
    <div style={{ height: "100vh" }}>
      <LabManagerClient /> {/* Render the new client component */}
      <Salesiq />
    </div>
  )
}
