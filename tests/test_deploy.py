import copy
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('deploy', Path(__file__).resolve().parents[1] / 'scripts/deploy.py')
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class PlanGuard(unittest.TestCase):
    def setUp(self):
        self.plan = {'status': 'ACTIVE', 'planFamily': 'CloudFront', 'planTier': 'FREE', 'resourceArns': ['cf', 'zone', 'waf']}

    def test_active_free_with_all_resources(self):
        deploy.check_subscription(self.plan, 'cf', 'zone', 'waf')

    def test_rejects_paid_inactive_detached_and_pending(self):
        for change in ({'planTier': 'PRO'}, {'status': 'SYNC_IN_PROGRESS'},
                       {'resourceArns': ['cf', 'waf']}, {'scheduledChange': {'changeType': 'CANCELLATION'}}):
            plan = copy.deepcopy(self.plan)
            plan.update(change)
            with self.subTest(change=change), self.assertRaises(ValueError):
                deploy.check_subscription(plan, 'cf', 'zone', 'waf')


if __name__ == '__main__':
    unittest.main()
