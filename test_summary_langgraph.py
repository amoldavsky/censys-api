#!/usr/bin/env python3
"""
Minimal LangGraph Summary Generation Test
Clean Python implementation for notebook testing
"""

import os
import json
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum

# LangGraph and LangChain imports
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel, Field

# Set your OpenAI API key
os.environ["OPENAI_API_KEY"] = "your-api-key-here"

# --- Pydantic Models for Structured Output ---

class Severity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class SummaryOutput(BaseModel):
    """Structured output schema for LLM"""
    id: str = Field(description="Asset identifier")
    summary: str = Field(description="2-4 sentence security summary")
    severity: Severity = Field(description="Risk severity level")
    findings: List[str] = Field(description="List of security findings")
    recommendations: List[str] = Field(description="List of actionable recommendations")
    assumptions: List[str] = Field(description="List of assumptions made")
    evidence_extras: str = Field(default="", description="Additional evidence notes")
    fields_present_pct: int = Field(ge=0, le=100, description="Percentage of fields present")
    missing_fields: List[str] = Field(description="List of missing data fields")

# --- State Management ---

@dataclass
class GraphState:
    asset: Dict[str, Any]
    asset_type: str  # 'web' or 'host'
    summary: Optional[Dict[str, Any]] = None
    validation_feedback: Optional[str] = None
    attempt_count: int = 0
    is_valid: bool = False

# --- LLM Setup ---

llm = ChatOpenAI(
    model="gpt-4o-mini",
    temperature=0,
    max_retries=2,
)

# --- Prompt Templates ---

SUMMARY_PROMPT = """
# MISSION
You are a security analyst specializing in monitoring digital assets for risks and volatility.

Your task is to return a concise, evidence-based summary with a deterministic severity score.
No invented facts! Use only the provided asset data.

# SCORING BASIS (deterministic; highest rule wins)
- critical: expired cert OR ≤30 days to expiry OR self-signed on public web OR SHA-1/MD5 signature OR RSA<2048
- high: 31–60 days to expiry OR >100 SANs (likely shared/reused) OR CN/SAN mismatch with primary domain
- medium: 61–90 days to expiry OR wildcard cert with ≥25 SANs OR missing HTTPS redirects/security headers
- low: none of the above issues detected

# CONSTRAINTS
- Use only ASSET_JSON data. Do not invent facts.
- Be brief and specific. No filler, no marketing tone.
- Unknown/absent fields → list them under missing_fields
- Keep summary ≤4 sentences; findings ≤5 bullets; recommendations ≤4 bullets

{validation_feedback}
"""

# --- Node Functions ---

def summary_node(state: GraphState) -> Dict[str, Any]:
    """Generate summary using structured output"""
    print(f"🔄 Generating summary (attempt {state.attempt_count + 1})")
    
    # Build prompt with validation feedback if retrying
    feedback = ""
    if state.validation_feedback:
        feedback = f"\n\nPREVIOUS VALIDATION FEEDBACK:\n{state.validation_feedback}"
    
    prompt = SUMMARY_PROMPT.format(validation_feedback=feedback)
    
    messages = [
        SystemMessage(content=prompt),
        HumanMessage(content=f"ASSET_JSON:\n{json.dumps(state.asset, indent=2)}")
    ]
    
    # Use structured output
    structured_llm = llm.with_structured_output(SummaryOutput)
    result = structured_llm.invoke(messages)
    
    # Transform to final format
    summary = {
        "id": result.id,
        "summary": result.summary,
        "severity": result.severity.value,
        "evidence": {},  # Simplified
        "evidence_extras": result.evidence_extras,
        "findings": result.findings,
        "recommendations": result.recommendations,
        "assumptions": result.assumptions,
        "data_coverage": {
            "fields_present_pct": result.fields_present_pct,
            "missing_fields": result.missing_fields
        }
    }
    
    return {
        "summary": summary,
        "attempt_count": state.attempt_count + 1
    }

def validation_node(state: GraphState) -> Dict[str, Any]:
    """Simple validation - placeholder for now"""
    print("🔍 Validating summary")
    
    # Simple validation rules
    issues = []
    summary = state.summary
    
    if not summary:
        issues.append("Summary is missing")
    else:
        if not summary.get("summary") or len(summary["summary"]) < 10:
            issues.append("Summary text too short")
        if not summary.get("findings") or len(summary["findings"]) == 0:
            issues.append("At least one finding required")
        if not summary.get("recommendations") or len(summary["recommendations"]) == 0:
            issues.append("At least one recommendation required")
    
    is_valid = len(issues) == 0
    validation_feedback = None if is_valid else "\n".join(issues)
    
    print(f"✅ Valid: {is_valid}" + (f" | Issues: {len(issues)}" if issues else ""))
    
    return {
        "is_valid": is_valid,
        "validation_feedback": validation_feedback
    }

def should_retry(state: GraphState) -> str:
    """Router function"""
    if state.is_valid or state.attempt_count >= 2:
        return END
    return "generate"

# --- Main Workflow ---

def create_workflow():
    """Create and compile the LangGraph workflow"""
    workflow = StateGraph(GraphState)
    
    # Add nodes
    workflow.add_node("generate", summary_node)
    workflow.add_node("validate", validation_node)
    
    # Add edges
    workflow.add_edge("generate", "validate")
    workflow.add_conditional_edges("validate", should_retry, {
        "generate": "generate",
        END: END
    })
    
    # Set entry point
    workflow.set_entry_point("generate")
    
    return workflow.compile()

def run_summary_generation(asset_data: Dict[str, Any], asset_type: str = "web"):
    """Run the complete summary generation workflow"""
    print(f"🚀 Starting LangGraph summary generation for {asset_type} asset")
    
    # Create workflow
    app = create_workflow()
    
    # Initial state
    initial_state = GraphState(
        asset=asset_data,
        asset_type=asset_type,
        attempt_count=0,
        is_valid=False
    )
    
    # Run workflow
    final_state = app.invoke(initial_state)
    
    if not final_state.is_valid or not final_state.summary:
        raise Exception(f"Summary generation failed after {final_state.attempt_count} attempts")
    
    print(f"✅ Summary generation completed in {final_state.attempt_count} attempts")
    return final_state.summary

# --- Test Data ---

SAMPLE_WEB_ASSET = {
    "id": "test.example.com",
    "fingerprint_sha256": "a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890",
    "domains": ["test.example.com", "www.test.example.com"],
    "subject": {
        "common_name": "test.example.com",
        "organization": "Test Organization"
    },
    "issuer": {
        "common_name": "Test CA",
        "organization": "Test Certificate Authority"
    },
    "validity_period": {
        "not_before": "2024-01-01T00:00:00Z",
        "not_after": "2025-01-01T00:00:00Z"
    },
    "key_info": {
        "algorithm": "RSA",
        "size": 2048
    }
}

# --- Main Execution ---

if __name__ == "__main__":
    try:
        # Run the workflow
        result = run_summary_generation(SAMPLE_WEB_ASSET, "web")
        
        # Display results
        print("\n" + "="*60)
        print("🎯 GENERATED SUMMARY")
        print("="*60)
        print(f"Asset ID: {result['id']}")
        print(f"Severity: {result['severity'].upper()}")
        print(f"\nSummary:\n{result['summary']}")
        print(f"\nFindings ({len(result['findings'])}):")
        for i, finding in enumerate(result['findings'], 1):
            print(f"  {i}. {finding}")
        print(f"\nRecommendations ({len(result['recommendations'])}):")
        for i, rec in enumerate(result['recommendations'], 1):
            print(f"  {i}. {rec}")
        if result['assumptions']:
            print(f"\nAssumptions ({len(result['assumptions'])}):")
            for i, assumption in enumerate(result['assumptions'], 1):
                print(f"  {i}. {assumption}")
        print(f"\nData Coverage: {result['data_coverage']['fields_present_pct']}%")
        if result['data_coverage']['missing_fields']:
            print(f"Missing fields: {', '.join(result['data_coverage']['missing_fields'])}")
        print("="*60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
