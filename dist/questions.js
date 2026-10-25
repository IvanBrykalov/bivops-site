'use strict';
const QUESTIONS = [
  {
    "id": "q1",
    "topic": "Kubernetes",
    "question": "A running container fails its readiness probe. What does Kubernetes normally do for a Service that does not publish unready addresses?",
    "options": [
      "Restarts the container immediately",
      "Stops routing Service traffic to that unready Pod",
      "Deletes the Deployment",
      "Moves the Pod to another node"
    ],
    "correct": 1,
    "feedback": [
      "Restart behavior is associated with liveness or startup failures, not a readiness failure alone.",
      "Readiness determines whether the Pod is eligible to receive normal Service traffic. The container can keep running while unready.",
      "A readiness failure does not delete the Deployment.",
      "Readiness does not trigger a move to another node."
    ],
    "hint": "Think about accepting traffic versus keeping a process alive.",
    "url": "https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/"
  },
  {
    "id": "q2",
    "topic": "Terraform",
    "question": "You want to review proposed infrastructure changes before applying them. Which command is intended for this?",
    "options": [
      "terraform import",
      "terraform output",
      "terraform plan",
      "terraform apply -auto-approve"
    ],
    "correct": 2,
    "feedback": [
      "Import associates an existing object with Terraform state; it is not the normal change-preview command.",
      "Output displays values exposed by the configuration. It does not preview resource changes.",
      "Plan compares configuration and state to propose actions. It does not carry out the proposed infrastructure changes.",
      "Apply with auto-approve skips the interactive approval prompt and performs changes."
    ],
    "hint": "Look for the command that prepares proposed actions for review.",
    "url": "https://developer.hashicorp.com/terraform/cli/commands/plan"
  },
  {
    "id": "q3",
    "topic": "Vault",
    "question": "A service uses dynamic credentials issued by Vault. What is the purpose of the associated lease?",
    "options": [
      "Track their lifetime and support renewal or revocation",
      "Make the credentials permanent",
      "Store the credentials in Git",
      "Remove the need for access policies"
    ],
    "correct": 0,
    "feedback": [
      "A lease tracks lifetime and renewability. Expiry or explicit revocation lets Vault revoke the dynamic credentials.",
      "A dynamic credential lease has a bounded lifetime, not a promise of permanent validity.",
      "A lease is lifecycle metadata, not a mechanism for putting credentials in source control.",
      "Policies still control access; leases control credential lifetime."
    ],
    "hint": "Consider what should happen when short-lived access is no longer needed.",
    "url": "https://developer.hashicorp.com/vault/docs/concepts/lease"
  },
  {
    "id": "q4",
    "topic": "Helm",
    "question": "What does helm template myapp ./chart normally do?",
    "options": [
      "Installs a release in the current cluster",
      "Uploads the chart to a registry",
      "Guarantees that every rendered API is supported by the cluster",
      "Renders chart templates locally without installing a release"
    ],
    "correct": 3,
    "feedback": [
      "Installing a release is the job of helm install; template renders output.",
      "Pushing a packaged chart to a registry is a separate operation.",
      "Local rendering alone does not perform server-side API validation.",
      "Template renders manifests locally. Successful rendering is not a guarantee that a cluster will accept them."
    ],
    "hint": "Separate generating manifests from submitting them to Kubernetes.",
    "url": "https://helm.sh/docs/helm/helm_template/"
  },
  {
    "id": "q5",
    "topic": "Argo CD",
    "question": "For a standalone application with automated sync enabled, which option allows Argo CD to correct live-cluster drift from Git?",
    "options": [
      "allowEmpty: true",
      "selfHeal: true",
      "prune: true",
      "enabled: false"
    ],
    "correct": 1,
    "feedback": [
      "AllowEmpty permits an empty target set when automatic pruning is enabled; it does not enable drift correction.",
      "Self-healing allows automated sync to react to changes in the live cluster and restore the desired state.",
      "Prune handles resources removed from the desired configuration; it is not the self-healing switch.",
      "Setting enabled to false disables automated sync, even if other automated options are set."
    ],
    "hint": "The desired state has not changed. The live state has.",
    "url": "https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/"
  },
  {
    "id": "q6",
    "topic": "Ansible",
    "question": "Which task-level setting can make a task run normally even when ansible-playbook is invoked with --check?",
    "options": [
      "changed_when: false",
      "check_mode: true",
      "check_mode: false",
      "diff: false"
    ],
    "correct": 2,
    "feedback": [
      "ChangedWhen controls how a task reports change; it does not override check mode.",
      "CheckMode true forces simulation for that task.",
      "CheckMode false forces normal execution for that task, so --check is not an unconditional guarantee of no changes.",
      "Diff false suppresses diff output; it does not control task execution mode."
    ],
    "hint": "Check whether a task explicitly overrides the command-line mode.",
    "url": "https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_checkmode.html"
  },
  {
    "id": "q7",
    "topic": "Go",
    "question": "What does go process() do in Go?",
    "options": [
      "Starts process() in a new goroutine",
      "Waits for process() to finish before continuing",
      "Starts a new operating-system process",
      "Guarantees that process() finishes before main returns"
    ],
    "correct": 0,
    "feedback": [
      "A go statement starts a function call in a new goroutine. Waiting for completion requires separate coordination.",
      "A plain function call waits for the call to return; a go statement starts concurrent execution.",
      "A goroutine is a Go runtime execution unit, not a new operating-system process.",
      "The go statement alone provides no completion guarantee before main exits."
    ],
    "hint": "Concurrency and waiting for completion are separate concerns.",
    "url": "https://go.dev/ref/spec#Go_statements"
  },
  {
    "id": "q8",
    "topic": "Kubernetes operators",
    "question": "What is the core role of a Kubernetes operator?",
    "options": [
      "Replace all built-in Kubernetes controllers",
      "Store application source code in a container registry",
      "Run kubectl once when a cluster starts",
      "Reconcile application-specific desired state using a controller and custom resources"
    ],
    "correct": 3,
    "feedback": [
      "Operators extend Kubernetes automation rather than replace all of its existing controllers.",
      "Container registries distribute images; storing source code is not the operator pattern.",
      "An operator uses a continuing control loop, not a single startup command.",
      "An operator combines application knowledge with custom resources and a controller that reconciles desired and observed state."
    ],
    "hint": "Think of an ongoing control loop with application-specific knowledge.",
    "url": "https://kubernetes.io/docs/concepts/extend-kubernetes/operator/"
  }
];
if(typeof module!=='undefined') module.exports=QUESTIONS;
