---
stableId: "arxiv:2609.18435"
sourceVersion: "v1"
status: "deep-read-candidate"
firstSeenAt: 2026-09-18
lastVerifiedAt: 2026-09-18
primaryTrack: "agent-systems"
primaryGap: "agent-evaluation"
score:
  topicRelevance: 5
  novelty: 5
  evidenceQuality: 4
  reproducibility: 4
  engineeringValue: 5
  seriesValue: 5
  total: 28
decision: "deep-read-candidate"
---

# WetRobo: A Reproducible Robot Kit for Coding Agents in Biological Laboratories

## Identity

- Search window: Strict 72-hour scan ending 2026-09-18; arXiv v1 was submitted on 2026-09-16 at 10:27 UTC.
- Canonical URL: https://arxiv.org/abs/2609.18435
- Full paper: https://arxiv.org/html/2609.18435v1
- Authors: Yuna Oikawa, Kei Endo, Takanori Uzawa, Yunzhe Zhang, Manan Anjaria, Lerrel Pinto, Sherry Yang, and Koji Tsuda.
- Venue or review status: arXiv preprint in cs.AI and cs.RO; no peer-review status was assumed.
- Code / model / data: https://github.com/tsudalab/WetRobo; the repository includes base control code, AGENTS.md, 15 teleoperation demonstrations per task, replay material, and evolved program branches. No repository license was declared at verification time.

## Editorial fit

- Reader question: Can a coding agent adapt a robot to a new laboratory from a reusable kit and local observation, without training a new policy for every room?
- Why this belongs in the selected track: WetRobo makes the agent responsible for inspecting a physical setup, writing control code, executing it, and iterating under explicit safety instructions.
- Gap it fills: agent-systems / agent-evaluation, especially embodied tool use, local adaptation, and reproducible evaluation outside text-only benchmarks.
- Why now: A VLA policy can overfit demonstrations from one lab. The paper offers a contrasting interface: ship the control stack and demonstrations, then let a coding agent adapt the program at the destination.

## Claim map

- Problem: General-purpose robot policies can lose performance when cameras, object positions, or laboratory equipment change, while per-lab teleoperation and neural-network training are expensive.
- Main claim: A reproducible robot kit plus an AGENTS.md workflow lets a coding agent adapt laboratory tasks in the target environment.
- Method: Package one AgileX Piper arm, laboratory objects, base control code, fifteen teleoperated demonstrations per task, safety/localization instructions, and a natural-language task interface. The agent observes the local setup and writes or executes Python/OpenCV-based programs.
- What is genuinely new: The transferable unit is a repository and operating contract, not a learned policy. The code exemplar preserves the sequence of trial branches so each adaptation can be inspected as a diff.

## Evidence audit

- Datasets: Fifteen Meta Quest teleoperation demonstrations are provided for each of three tasks: lifting a Petri dish lid, removing a reagent-bottle cap, and opening an incubator door.
- Benchmarks and metrics: The paper reports three successful real-world tasks with OpenAI Codex gpt-5.6-sol. The bottle-cap task succeeds in both Lab X and Lab Y, while a VLA fine-tuned on Lab X succeeds in Lab X but fails to transfer to Lab Y.
- Baselines: The main contrast is coding-agent adaptation versus a VLA fine-tuned on Lab-X demonstrations. The repository also supports one-demo replay and live-bias/safety paths.
- Ablations: The evolved programs use object localization, image registration, depth, RANSAC, aperture/contact checks, and task-specific verification; the paper shows how successive trial branches add these components rather than reporting a single opaque policy.
- Statistical uncertainty: The headline is a small demonstration, not a powered benchmark. Adaptation trials are successive rather than independent, and success rates are tied to one hardware/camera arrangement.
- Threats to validity: One model/agent, three narrow tasks, one arm and incubator, fixed camera/reference-object conditions, and no Petri-dish transport task restrict generalization. Physical execution also carries safety and hardware-failure risks not captured by task success.

## Reproducibility

- Available artifacts and licenses: The repository provides AGENTS.md, control code, environment configuration, robot/camera maps, demo HDF5 trajectories and videos, replay scripts, and branch snapshots. No license was declared, and the setup depends on specific hardware and drivers.
- Environment or compute requirements: AgileX Piper hardware, Dynamixel gripper, RGB-D and wrist cameras, Record3D/ROS-style components, piperlib, SciPy, OpenCV, h5py, and a compatible coding-agent runtime are required.
- Smallest useful reproduction: Start with the provided demo replay without commanding hardware, validate camera and safety configuration, then run one task in a controlled lab with a human emergency stop and log every generated program, observation, and verification result.
- Blocking unknowns: Hardware calibration, camera placement, success-trial independence, failure logs, and license/redistribution terms prevent a simple software-only reproduction of the real-lab claims.

## Critical reading

- Strongest result: The cross-lab bottle-cap contrast exposes an important systems choice: adaptation through inspectable code can transfer where a location-specific learned policy does not.
- Weakest assumption: Local program repair by a coding agent will remain safe and reliable as objects, lighting, calibration, and lab protocols vary beyond the demonstrated setup.
- Stated limitations: The authors explicitly limit the result to one model, narrow tasks, successive adaptation trials, one camera/reference configuration, and incomplete task breadth.
- Claims not supported by the evidence: The paper does not establish general-purpose laboratory autonomy, better average success than VLAs, or safe unsupervised operation.

## Bloss0m connection

- Related Traditional Chinese routes: [When Tool Calls Succeed but Workflows Fail](/paper-reading/49-when-tool-calls-succeed-workflows-fail/), [ADIAS](/paper-reading/48-adias-agent-self-improvement/), and [ScienceIDE](/paper-reading/55-scienceide-scientific-code-environments/).
- Related English routes: [When Tool Calls Succeed but Workflows Fail](/en/paper-reading/49-when-tool-calls-succeed-workflows-fail/), [ADIAS](/en/paper-reading/48-adias-agent-self-improvement/), and [ScienceIDE](/en/paper-reading/55-scienceide-scientific-code-environments/).
- Duplication risk: Low. Existing content discusses tool reliability and agent self-improvement, but WetRobo adds physical execution, hardware transfer, and repository-as-policy.
- Suggested internal links: Embodied tool contracts, safety interlocks, code-agent evaluation, and evidence/provenance logging.

## Recommendation

- Output level: Deep Read.
- Score rationale: 28/30: surprising embodied-agent angle, inspectable code and demonstrations, direct cross-lab evidence, and high engineering value. Evidence and reproducibility are 4 because the demonstration is narrow, hardware-specific, successive rather than independent, and the repository has no declared license.
- Open questions requiring human approval: What is the minimum safety contract before an agent may execute a physical program? Can the branch/diff workflow scale to more labs and tasks? Which failures should be counted as adaptation failures versus hardware/calibration failures?
