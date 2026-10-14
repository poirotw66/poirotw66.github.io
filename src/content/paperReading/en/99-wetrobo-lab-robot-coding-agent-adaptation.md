---
title: "WetRobo: How Coding Agents Adapt Lab Robots"
description: "WetRobo packages a transferable robot setup, operating rules, and inspectable code so a coding agent can adapt programs in two biological laboratories. This reading examines three narrow tasks, the cross-lab bottle-cap comparison, and what the evidence cannot establish."
pubDate: 2026-10-14
tldr:
  - "WetRobo packages one robot configuration, its base control code, operating rules, and 15 demonstrations per task. A coding agent observes the local setup, writes and executes programs, and leaves successive program branches."
  - "The authors report physical demonstrations for a Petri-dish lid, reagent-bottle cap, and incubator door. The bottle-cap task succeeded in Labs X and Y; a π0.5 VLA fine-tuned on Lab X data did not transfer to Lab Y."
  - "This is not a general laboratory-autonomy benchmark: each task followed one successive adaptation history, with one Codex model and a narrow hardware setup. The door succeeded only in Lab X, and the VLA comparison is not a fully cost-matched study."
audience:
  - "Researchers evaluating coding agents, robot program generation, and physical tool use"
  - "Engineers planning laboratory automation, robot safety boundaries, and reproducible evaluation"
tags: ["Paper Reading", "AI Agent", "Agent Systems", "Robotics", "Evaluation"]
topics:
  - agent-evaluation-observability
  - tool-use-coding-agents
image: "/paperReading/99-wetrobo-lab-robot-coding-agent-adaptation/title_image.webp"
field: "AI Systems"
difficulty: "advanced"
showToc: true
paper:
  title: "WetRobo: A Reproducible Robot Kit for Coding Agents in Biological Laboratories"
  authors:
    - "Yuna Oikawa"
    - "Kei Endo"
    - "Takanori Uzawa"
    - "Yunzhe Zhang"
    - "Manan Anjaria"
    - "Lerrel Pinto"
    - "Sherry Yang"
    - "Koji Tsuda"
  year: 2026
  venue: "arXiv:2609.18435 v1 (2026-09-16; preprint; peer-review status not established)"
  links:
    pdf: "https://arxiv.org/pdf/2609.18435v1"
    arxiv: "https://arxiv.org/abs/2609.18435"
    code: "https://github.com/tsudalab/WetRobo"
---

## The paper in 90 seconds

- **Problem:** Local laboratories differ in equipment, camera angles, grippers, and bench layouts. If every move requires collecting teleoperation data and fine-tuning a neural network again, individual labs may struggle to obtain the automation available to large centralized facilities.
- **Core insight:** The authors make a robot kit, rather than a trained motion policy, the unit of transfer. It includes base control code, hardware and camera specifications, task demonstrations, and operating rules in `AGENTS.md`. A coding agent reads local images and state, writes analysis and control programs, and records each program's evolution in repository branches.
- **Strongest evidence:** OpenAI Codex CLI running gpt-5.6-sol completed three physical tasks: lifting a Petri-dish lid, removing a bottle cap, and opening an incubator door. The bottle-cap task succeeded in two laboratories with different conditions. The authors' π0.5 VLA, fine-tuned for 100k steps on 25 Lab X demonstrations, succeeded in Lab X but did not transfer to Lab Y (Sections III-A–C; Figure 5; Table I).
- **Main boundary:** These are author-reported demonstrations of narrow tasks, not a reliability estimate. Adaptation attempts were successive rather than independent; only one model and hardware configuration were evaluated; the door succeeded only in Lab X, while the Lab Y door run stopped before contact. Safety rules constrain the setup, but do not show that unattended execution is safe.

This reading follows the arXiv v1 preprint submitted on September 16, 2026; peer review has not been established. The paper asks not simply whether a robot can repeat the same motion, but whether a documented, executable starting point can move to another laboratory and let an agent write a controller for the local environment. The authors demonstrate three operations and one cross-laboratory bottle-cap comparison. This makes code-as-policy adaptation worth studying, while leaving a practical question: how much evidence separates one successful sequence of adjustments from predictable and safe automation?

## Prior approach limitation: What has to be relearned in a new laboratory?

Biological research includes many repetitive operations, but an individual laboratory may already own different equipment and may lack the budget or staff to operate a large automation platform. Vision-language-action (VLA) models let researchers describe a manipulation task in language, yet performance can depend on camera viewpoint, object location and appearance, or robot initial state. Training data from one laboratory does not guarantee that a policy will still align with its target after being moved to another room.

WetRobo takes a different path. It does not package the policy as a network that accepts images and emits actions with little visible intermediate logic. Instead, it places the control interface, demonstrations, and local operating rules in a readable repository. An agent can write Python/OpenCV programs, estimate position from depth images, design small probe motions, revise control logic, and move the arm through an existing RPC interface. What changes is an inspectable and editable procedure; this does not mean that code is inherently safer or more general than a learned policy.

The question connects to [coding-agent harness design](/en/paper-reading/91-harness-design-coding-agents/): an agent's capability depends jointly on its observations, action interface, and execution feedback. It can also be read alongside [tools and workflows in scientific coding environments](/en/paper-reading/95-scienceide-scientific-code-environments/). WetRobo adds physical contact, collision, and equipment safety, so evidence from text-only coding tasks cannot establish those properties.

## Core intuition: move a reusable starting point, adapt it locally

Think of the kit as four dependent inputs. The base control stack provides observation and command interfaces. `AGENTS.md` states device rules, safety constraints, and an initial workflow. Demonstrations offer optional movement references. The laboratory supplies observations and geometry for the task at hand. Under these conditions, the coding agent generates programs, then reads back outcomes such as gripper aperture, joint state, camera images, or contact signals.

This is more than translating natural language into coordinates. For a bottle-cap task, the agent must locate the cap, estimate how image displacement relates to arm movement, approach with the gripper, decide whether the cap was grasped, then twist and lift it. Each stage uses different observations. For example, “the close command was issued” does not mean “the cap is held.” The programs expose target positions, step sizes, closure checks, and stop conditions, making it possible to inspect specific logic after a failure.

Keep two meanings of “reproducible” separate. The repository preserves a base program and branches from successive trials, so readers can trace how code changed. Hardware calibration, camera placement, lighting, and object state still belong to the local installation. Program snapshots do not guarantee that every lab can replay the same result, nor do they make the adaptation process a standardized benchmark.

## Walk one example through the method: the bottle-cap task

The following stages summarize the Lab Y bottle-cap trial in Section III-B. They reflect the reported sequence; they should not be read as independent samples that can be repeated without state or learning effects.

1. **Read the local scene.** The agent located the white cap in camera images and used Record3D depth with camera intrinsics to estimate its position in metric coordinates. The current camera must be grounded to the current arm; reusing coordinates from another room could send the gripper in the wrong direction.
2. **Probe and calibrate locally.** It moved along three axes and compared image corners before and after each probe to estimate a local image Jacobian. This approximates how small arm movements appear in the image near the current configuration. It is not a global camera-to-robot model.
3. **Approach in stages.** The controller moved a short distance, then read the cameras again. In Lab Y, bottle movement in the image and joint torque helped detect contact; when the bottle shifted while torque stayed within its limit, the program retreated by half a step.
4. **Make failures legible.** The first three closures missed. Aperture measurements resembled an empty close, effort remained near the empty-close baseline, and images showed the gripper above or beside the cap. The agent did not treat “close executed” as success; it backed away and adjusted its orientation.
5. **Change wrist orientation and check the grasp.** The program added a wrist-hold variant that moved only the first three joints, keeping the wrist orientation fixed while re-centering the jaws. On the next closure, the measured aperture stopped at 0.68 against a command target of 0.50, and effort was −1.05 N·m compared with approximately −0.1 to −0.2 N·m for an empty close. The paper interprets these readings as evidence that the cap was held.
6. **Twist, then lift.** The program kept the fingertips in place while rotating around the world z-axis three times, then lifted a short distance to check retention. This is the sequence that obtained the first successful grasp. It is not a four-trial success rate, nor evidence that the cap was fully unscrewed or that a downstream biological workflow was completed.

The important point is not that the agent wrote many programs. Its success condition combined several observable signals: geometric localization, motion feedback, gripper aperture, effort, and retention after lifting. Retreating, repositioning, and saving program branches made the adjustments inspectable. The process still depended on particular arms, cameras, equipment, and safety settings. If the sensor signals themselves are unreliable, readable code does not supply the missing facts.

## Kit mechanism: hardware, code, and safety constraints

The paper describes WetRobo as a Git repository combined with a Piper arm, laboratory equipment, and fifteen teleoperation demonstrations per task. Each reported execution used the right six-degree-of-freedom AgileX Piper arm. Lab Y used the native gripper, while Lab X used an NYU string-driven Dynamixel gripper. The labs also differed in camera counts, bench luminance, and equipment orientation (Section II; Table I). “Transferable” therefore does not mean that the physical equipment was cloned exactly; the same code starting point had to adapt to local differences.

The base stack can replay an HDF5 demonstration with a Cartesian arm bias, and offers live bias adjustment, camera images, and RPC control. Trial branches preserve evolved programs. The `AGENTS.md` rules include pose and grasp precautions: keep gripper jaws horizontal through approach, grasp, and transport when handling culture equipment; pause before contact for image-based confirmation; constrain the workspace and each motion step. The authors also state that collision reactions are absent, so an available stop path is necessary (Sections II-A and II-D). These rules are preventive design constraints, not a complete safety case, hardware emergency-stop validation, or certification.

Control does not stop at a single generated program. The agent can select external tools: for the Petri-dish task, it used SAM segmentation, RGB-D point clouds, and MuJoCo contact search; in Lab X, it used a pre-positioned AprilTag and simulated collision checks; for the incubator door, it used OpenCV features, depth planes, and NumPy RANSAC for orientation estimates. The interface therefore includes two decisions: how to interpret the scene and when to move again. More external dependencies also increase environment setup and software-version management requirements.

![The WetRobo observation, program-generation, and robot-control loop.](https://arxiv.org/html/2609.18435v1/assets/fig_agent_control_flow.png)
*Figure 3 (Section III) diagrams the agent control loop: camera and joint observations, analysis programs, action programs, and the Piper control interface. It shows the system boundary, not a success-rate evaluation. Source: [arXiv Figure 3](https://arxiv.org/html/2609.18435v1#S3.F3) · [original image](https://arxiv.org/html/2609.18435v1/assets/fig_agent_control_flow.png). The paper is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); this figure is reused without modification with author and source attribution.*

## Three tasks and one cross-laboratory comparison

The Petri-dish task was to lift the lid, not to pick up or transport the dish. The agent first tried to replay a demonstration with a bias to compensate for the displaced dish. When estimating the offset proved difficult, it switched to segmentation and visual servoing. It then replaced a marker-plane reference with a Record3D point cloud, built a multi-view scene and MuJoCo model, and used gripper aperture measurements to distinguish empty closes from grasps (Section III-A; Figure 4). Figure 4 shows a task outcome, not a controlled comparison among methods; it establishes only that the reported run completed.

The bottle-cap task is the only direct cross-laboratory transfer comparison. Labs X and Y differed in lighting, gripper, and camera arrangement, among other conditions. The authors report that the coding agent grasped the cap in both. A π0.5 VLA fine-tuned for 100k steps on 25 demonstrations collected in Lab X succeeded in X and failed to transfer to Y. Figure 5 presents results for both approaches, but the coding-agent “success rate” denominator counts repeated executions in the same setting after adaptation and initial success. It should not be treated as a randomized comparison with an equal sample basis and equal cost. Table I reports 1 hour 2 minutes in Lab X and 48 minutes 43 seconds in Lab Y until the first grasp, with 41.4M and 23.0M tokens, respectively. Those are single adaptation records, not a total cost-of-ownership analysis or general cost estimate.

![Bottle-cap adaptation results and VLA comparison across two labs.](https://arxiv.org/html/2609.18435v1/fig_cap_comparison.png)
*Figure 5 (Section III-B) compares the Lab X and Lab Y setups above, with coding-agent repeated executions after adaptation and VLA evaluation results below. Preserve the paper's note that these success-rate denominators differ. Source: [arXiv Figure 5](https://arxiv.org/html/2609.18435v1#S3.F5) · [original image](https://arxiv.org/html/2609.18435v1/fig_cap_comparison.png). The paper is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); this original figure is reused unchanged with attribution.*

The incubator-door result distinguishes alignment from holding securely. In Lab Y, unreliable head-camera alignment caused the agent to stop before contact; the door did not open. In Lab X, the agent revised its program step by step: it used a red label to estimate image offsets, measured gripper aperture to distinguish an empty close from holding the handle, used a 5 mm proof pull to test retention, then fitted a plane to depth points to estimate door yaw and correct the approach angle. It eventually checked door state by comparing depth against open and closed reference images. In that execution, relative error changed from 1.417 to 0.179. After one success, the authors repeated the task in the same setting in 3 minutes 27 seconds, including parser repairs and restarts (Sections III-C; Figures 7–11). This is not evidence of door-task transfer between labs.

![Lab Y bottle-cap adaptation stages through the first grasp, with feedback and cumulative files and tokens.](https://arxiv.org/html/2609.18435v1/assets/labB_timeline.png)
*Figure 6 (Section III-B1) presents consecutive operation groups and cumulative file/token counts during the bottle-cap task. A phase is a group of operations, not one independently sampled gripper closure. Source: [arXiv Figure 6](https://arxiv.org/html/2609.18435v1#S3.F6) · [original image](https://arxiv.org/html/2609.18435v1/assets/labB_timeline.png). CC BY 4.0; reused unchanged with author attribution and source.*

![An incubator-door pose correction example and held-out displacement estimates.](https://arxiv.org/html/2609.18435v1/fig_door_regression.png)
*Figure 9 (Section III-C) shows a regression from wrist-camera feature residuals to lateral gripper displacement learned from demonstrations. The left panel shows label locations before and after correction; the right compares held-out predicted and true displacement. This is offline analysis within one task, not an independent laboratory validation. Source: [arXiv Figure 9](https://arxiv.org/html/2609.18435v1#S3.F9) · [original image](https://arxiv.org/html/2609.18435v1/fig_door_regression.png). The paper is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); the figure is reused unchanged with attribution.*

## Evidence map: author claims, supported readings, and gaps

| Paper claim | Direct basis | What it supports | What it should not become |
| --- | --- | --- | --- |
| The kit lets an agent adapt to three physical operations locally | Three lab tasks, evolved branches, and action records (Sections III-A–C; Figures 3–11) | Codex can programmatically iterate and complete these operations on the specified setup | General autonomy across arbitrary labs, equipment, or scientific workflows |
| Bottle-cap code works across two labs, while the evaluated VLA did not transfer | Lab X/Y conditions, first adaptations, repeated executions, and Lab-X-fine-tuned π0.5 comparison (Figure 5; Table I) | In this bottle-cap case, location-specific code adaptation crossed particular configuration differences | A coding agent is broadly better than a VLA in success rate, cost, safety, or task coverage |
| Programs evolve and some capability can be reused | Adjacent branches for the Petri dish, cap, and door, plus shared motion/camera helpers described by the authors (Section IV) | The repository makes one adaptation history inspectable | Every added program is portable, or development time reliably falls with each task |
| Observation can support grasp and endpoint checks | Gripper aperture/effort, proof pull, and door-depth reference (Sections III-B and III-C) | The report includes sensed conditions beyond an agent's self-description | Sensor readings and stop thresholds are calibrated across devices or provide a safety guarantee |

Diagnostic evidence is more useful than a list of successes alone. The first three bottle-cap closures failed, and the authors revised the orientation after observing those failures. The Lab Y incubator-door failure is also preserved rather than folded into a summary that suggests all three tasks worked everywhere. On the other hand, the paper does not report a distribution over multiple independent adaptations, a cross-model comparison, or controlled ablations of each component. When reading the repeated executions in Figure 5, remember that they did not restart adaptation from scratch; they are not an estimate of initial success probability.

## Limitations and unsupported interpretations

First, the study uses one coding-agent/model combination (Codex CLI with gpt-5.6-sol). We cannot infer that another model or harness would generate the same code or behave with the same safety properties. Second, each task's attempts were successive and carried forward evolved programs and physical state. They are not independent repetitions. The three task successes are capability demonstrations, not an estimated reliability rate. Third, only the bottle-cap task has a comparison across two laboratories. The Petri-dish result is lid lifting; the incubator door succeeded only in Lab X, and the Lab Y run stopped before contact.

Fourth, the environment is narrow: one Piper family, a small set of lab objects, and specific camera/reference-object and installation arrangements. Moving the dish itself while retaining a grasp was not demonstrated; the authors note that slipping after lifting the lid motivates work on sustained grasp. Fifth, the VLA comparison is limited to the bottle-cap task and does not match the full data collection, training, and inference costs. WetRobo reports coding-agent tokens and time, but not a lifecycle analysis of VLA training, data, and maintenance costs. Finally, the paper's rules, workspace limits, motion caps, and stop conditions are useful design materials, but should not be described as a validated safety case.

## Artifacts and reproducibility

As of October 14, 2026, the [WetRobo repository](https://github.com/tsudalab/WetRobo) is publicly browsable and includes a base control stack, `AGENTS.md`, fifteen teleoperation demonstrations per task, and evolved-program branches ordered by trial. The README specifies the arm, camera, and incubator configuration. GitHub repository metadata declares no license. Publicly viewable code and demonstrations therefore should not be assumed to be freely redistributable or usable under any desired terms. A full physical reproduction also requires a Piper arm, compatible gripper, cameras, Record3D, piperlib, OpenCV, and other dependencies, with local safety zones calibrated before commanding motion.

The reported experimental results are the authors' results; this reading did not rerun the hardware experiments. Public branches and demonstrations let readers inspect code and the sequence of trials, but do not provide independent cross-lab replications, a statistical estimate from independent adaptations, evaluations with other models, a complete account of safety risks across failures, or a declared license. Reading the README, `AGENTS.md`, and replay material without issuing hardware commands is a useful way to understand the interface. Any physical test should depend on local measurements, a verified emergency stop, and on-site supervision; the reported successes are not ready-to-run safety procedures.

## Bloss0m engineering judgment: when to consider it, and when to stop

**Bloss0m engineering synthesis:** When a task can be divided into observation, short movements, contact checks, and endpoint verification, with trustworthy sensors for each step, code-as-policy may make it easier for local staff to inspect why an agent moved, what signal caused it to retreat, and how it handled an observed failure. This is an engineering lesson inferred from the reported workflow, not a general rule tested by the authors.

Readable code is not enough when contact can cause irreversible harm, position or force feedback is absent, equipment installation varies widely, sensors cannot confirm task success, or there is no stop mechanism that can interrupt a motion. Liquids, cultures, glass, and door hinges can each introduce contamination or pinch hazards. Separate observation from motion authority, constrain the executable workspace, require a stop before contact, and have qualified staff define acceptable failure costs before automating a lab procedure. These are recommendations in this reading, not safety guarantees from the paper.

To move WetRobo toward a reliability evaluation, a next study would need several independent laboratories, multiple adaptations from initial state in each lab, more tasks and failures, multiple coding agents/models, matched comparisons on the same hardware, and a full accounting of labor, tokens, fine-tuning, and equipment maintenance. Repeated trials should preserve raw actions, sensed evidence, software versions, and stop reasons so a third party can audit success labels. These are proposed next steps; the original paper has not completed such an evaluation.

## Three things to remember

1. **Technical idea:** WetRobo treats a repository, operating rules, demonstrations, and hardware interfaces as an adaptation starting point. A coding agent writes inspectable programs rather than requiring a separately fine-tuned VLA policy for each lab.
2. **Evidence:** Physical demonstrations cover a Petri-dish lid, bottle cap, and incubator door. Only the cap comparison supports transfer between Labs X and Y; adaptation was successive, not a series of independent success trials.
3. **Boundary:** One model, narrow tasks, a fixed hardware family, and an undeclared repository license make this a useful prototype and source of evaluation questions, not evidence of general or unsupervised laboratory autonomy.

Continue with [coding-agent harness design](/en/paper-reading/91-harness-design-coding-agents/), [scientific coding environments](/en/paper-reading/95-scienceide-scientific-code-environments/), and [when agent tool calls succeed but workflows fail](/en/paper-reading/49-tool-calls-workflows-fail/). They add perspectives on execution frameworks, scientific workflows, and tool reliability.

## Primary sources

- Oikawa et al., [WetRobo: A Reproducible Robot Kit for Coding Agents in Biological Laboratories](https://arxiv.org/abs/2609.18435), arXiv:2609.18435 v1, submitted September 16, 2026. This reading uses v1 figure, table, and section anchors; the source record lists CC BY 4.0.
- [Full arXiv HTML v1](https://arxiv.org/html/2609.18435v1) and [PDF v1](https://arxiv.org/pdf/2609.18435v1).
- The authors' [WetRobo GitHub repository](https://github.com/tsudalab/WetRobo), with README, `AGENTS.md`, base stack, demonstrations, and branch snapshots. The repository declares no license.
