"use client";
import { useEffect } from "react";
import { trackReportViewed } from "@/lib/tracking";
export default function ReportViewed({ reportId }: { reportId: string }) {
  useEffect(() => { trackReportViewed({ report_id: reportId }); }, [reportId]);
  return null;
}
