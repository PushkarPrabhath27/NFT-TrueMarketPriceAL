"""
Reporting and Alert System for NFT Fraud Detection Platform
Implements detection report generation, evidence compilation, alert prioritization, routing, aggregation, and follow-up tracking.
"""
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

class Evidence:
    def __init__(self, datapoints: List[Any], visuals: Optional[List[Any]] = None, statistics: Optional[Dict[str, Any]] = None):
        self.datapoints = datapoints
        self.visuals = visuals or []
        self.statistics = statistics or {}

class DetectionReport:
    def __init__(self, report_type: str, findings: Dict[str, Any], evidence: Evidence, confidence: float, severity: str, historical_context: Optional[Dict[str, Any]] = None):
        self.report_id = str(uuid.uuid4())
        self.timestamp = datetime.utcnow()
        self.report_type = report_type  # e.g., 'image_similarity', 'wash_trading', etc.
        self.findings = findings
        self.evidence = evidence
        self.confidence = confidence  # 0.0 - 1.0
        self.severity = severity  # e.g., 'low', 'medium', 'high', 'critical'
        self.historical_context = historical_context or {}

class Alert:
    def __init__(self, report: DetectionReport, impact: str, urgency: str, scale: str, novelty: bool, stakeholders: List[str]):
        self.alert_id = str(uuid.uuid4())
        self.report = report
        self.impact = impact  # e.g., 'individual', 'collection-wide'
        self.urgency = urgency  # e.g., 'immediate', 'delayed'
        self.scale = scale
        self.novelty = novelty
        self.stakeholders = stakeholders
        self.status = 'open'  # open, escalated, resolved
        self.created_at = datetime.utcnow()
        self.follow_ups = []

class AlertManager:
    def __init__(self):
        self.alerts: Dict[str, Alert] = {}
        self.aggregated_alerts: Dict[str, List[str]] = {}  # key: aggregation_id, value: list of alert_ids
        self.suppressed_alerts: set = set()

    def classify_severity(self, report: DetectionReport) -> str:
        # Placeholder: implement impact/confidence/urgency/scale/novelty-based severity
        if report.severity == 'critical' or report.confidence > 0.9:
            return 'critical'
        elif report.severity == 'high' or report.confidence > 0.75:
            return 'high'
        elif report.severity == 'medium' or report.confidence > 0.5:
            return 'medium'
        return 'low'

    def create_alert(self, report: DetectionReport, impact: str, urgency: str, scale: str, novelty: bool, stakeholders: List[str]) -> Alert:
        alert = Alert(report, impact, urgency, scale, novelty, stakeholders)
        self.alerts[alert.alert_id] = alert
        return alert

    def aggregate_alerts(self, aggregation_key: str, alert_ids: List[str]):
        self.aggregated_alerts[aggregation_key] = alert_ids

    def suppress_duplicates(self, alert_id: str):
        self.suppressed_alerts.add(alert_id)

    def route_alert(self, alert: Alert) -> List[str]:
        # Placeholder: implement intelligent routing logic
        return alert.stakeholders

    def escalate_alert(self, alert_id: str):
        if alert_id in self.alerts:
            self.alerts[alert_id].status = 'escalated'

    def resolve_alert(self, alert_id: str, follow_up: Optional[str] = None):
        if alert_id in self.alerts:
            self.alerts[alert_id].status = 'resolved'
            if follow_up:
                self.alerts[alert_id].follow_ups.append(follow_up)

    def get_open_alerts(self) -> List[Alert]:
        return [a for a in self.alerts.values() if a.status == 'open']

    def get_alert_by_id(self, alert_id: str) -> Optional[Alert]:
        return self.alerts.get(alert_id)

# Example usage (integration with detection modules):
# 1. Generate a DetectionReport for a fraud type
# 2. Use AlertManager to classify, create, aggregate, suppress, route, escalate, and resolve alerts

# For extensibility, additional methods for feedback integration, alert history, and reporting can be added.