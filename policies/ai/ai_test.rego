package vasa.ai.ai_test
import rego.v1
import data.vasa.ai.safety
import data.vasa.ai.bias
import data.vasa.ai.drift

test_minor_inappropriate_denied if { count(safety.deny) > 0 with input as {"minor": true, "classification": {"age_appropriate": false}, "signals": {}} }
test_prompt_injection_denied if { count(safety.deny) > 0 with input as {"signals": {"prompt_injection": true}} }
test_unattested_model_deploy_denied if { count(bias.deny) > 0 with input as {"action": "model.deploy", "model": {"bias_attestation_signed": false}} }
test_drift_blocks_serving if { count(drift.deny) > 0 with input as {"action": "model.serve", "metrics": {"psi": 0.3}} }
