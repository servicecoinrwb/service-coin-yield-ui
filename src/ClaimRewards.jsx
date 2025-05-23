import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const rewardDistributor = '0x71f618EFb0422687e5B2ad9cD973aDACb645D9DE';
const srevToken = '0x2F745Da2FA453ee76c756fADcc081f59284B2a40';

import RewardDistributorABI from './abis/RewardDistributor.json';
import ERC20ABI from './abis/ERC20.json';

export default function ClaimRewards() {
  const { address } = useAccount();
  const [cooldown, setCooldown] = useState(0);

  const { data: pending } = useReadContract({
    address: rewardDistributor,
    abi: RewardDistributorABI,
    functionName: 'viewPending',
    args: [address],
    watch: true,
  });

  const { data: poolBalance } = useReadContract({
    address: rewardDistributor,
    abi: RewardDistributorABI,
    functionName: 'viewRewardPoolBalance',
    watch: true,
  });

  const { data: srevBalance } = useReadContract({
    address: srevToken,
    abi: ERC20ABI,
    functionName: 'balanceOf',
    args: [address],
    watch: true,
  });

  const { writeContract: claimRewards, isPending: isClaiming } = useWriteContract();

  useEffect(() => {
    const fetchCooldown = async () => {
      if (!address) return;
      try {
        const res = await fetch(`/api/cooldown?address=${address}`);
        const json = await res.json();
        setCooldown(json.seconds);
      } catch {
        setCooldown(0);
      }
    };
    fetchCooldown();
    const interval = setInterval(fetchCooldown, 10000);
    return () => clearInterval(interval);
  }, [address]);

  return (
    <div className="min-h-screen bg-[#FCD5B0] text-black font-mono">
      <div className="max-w-xl mx-auto py-12 px-4">
        <h1 className="text-3xl mb-6 font-bold">Service Coin – Real World Yield</h1>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="mb-1">Your SREV Balance:</div>
            <div className="text-lg font-bold">
              {srevBalance ? formatUnits(srevBalance, 18) : 'Loading...'} SREV
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="mb-1">Pending USDC Rewards:</div>
            <div className="text-2xl font-bold">
              {pending ? `${formatUnits(pending, 18)} USDC` : 'Loading...'}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="mb-1">Vault Pool Balance:</div>
            <div className="text-lg font-bold">
              {poolBalance ? `${formatUnits(poolBalance, 6)} USDC` : 'Loading...'}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="mb-1">Claim Cooldown:</div>
            <div className="text-lg">
              {cooldown === 0 ? '✅ Ready to claim' : `${Math.ceil(cooldown / 60)} minutes remaining`}
            </div>
          </CardContent>
        </Card>

        <Button
          disabled={isClaiming || cooldown > 0}
          onClick={() =>
            claimRewards({
              address: rewardDistributor,
              abi: RewardDistributorABI,
              functionName: 'claim',
            })
          }
        >
          {isClaiming ? 'Claiming...' : 'Claim Now'}
        </Button>
      </div>
    </div>
  );
}
