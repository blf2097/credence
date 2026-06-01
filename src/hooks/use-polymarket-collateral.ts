'use client';

import { erc20Abi, formatUnits, parseUnits, type Address } from 'viem';
import {
  useAccount,
  useChainId,
  useReadContracts,
  useWriteContract,
} from 'wagmi';
import { polygon } from 'wagmi/chains';
import {
  POLYMARKET_COLLATERAL_DECIMALS,
  POLYMARKET_CONTRACTS,
  getExchangeSpender,
} from '@/lib/polymarket/contracts';

interface UsePolymarketCollateralParams {
  amount: string;
  negRisk?: boolean;
}

export function usePolymarketCollateral({
  amount,
  negRisk,
}: UsePolymarketCollateralParams) {
  const { address } = useAccount();
  const chainId = useChainId();
  const spender = getExchangeSpender({ negRisk });
  const amountWei = parseCollateralAmount(amount);

  const { data, isLoading, refetch } = useReadContracts({
    allowFailure: true,
    query: {
      enabled: Boolean(address) && chainId === polygon.id,
      refetchInterval: 12_000,
    },
    contracts: [
      {
        address: POLYMARKET_CONTRACTS.pUsdCollateral,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as Address],
        chainId: polygon.id,
      },
      {
        address: POLYMARKET_CONTRACTS.pUsdCollateral,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as Address, spender],
        chainId: polygon.id,
      },
    ],
  });

  const { writeContractAsync, isPending: isApproving } = useWriteContract();
  const balance = data?.[0]?.status === 'success' ? data[0].result : 0n;
  const allowance = data?.[1]?.status === 'success' ? data[1].result : 0n;

  const hasEnoughBalance = amountWei > 0n && balance >= amountWei;
  const hasEnoughAllowance = amountWei > 0n && allowance >= amountWei;

  async function approve() {
    if (!address || amountWei <= 0n) return;
    await writeContractAsync({
      address: POLYMARKET_CONTRACTS.pUsdCollateral,
      abi: erc20Abi,
      functionName: 'approve',
      args: [spender, amountWei],
      chainId: polygon.id,
    });
    await refetch();
  }

  return {
    spender,
    balance,
    allowance,
    amountWei,
    balanceFormatted: formatCollateral(balance),
    allowanceFormatted: formatCollateral(allowance),
    hasEnoughBalance,
    hasEnoughAllowance,
    isLoading,
    isApproving,
    approve,
  };
}

function parseCollateralAmount(value: string): bigint {
  const normalized = value.trim();
  if (!normalized || Number(normalized) <= 0) return 0n;
  try {
    return parseUnits(normalized, POLYMARKET_COLLATERAL_DECIMALS);
  } catch {
    return 0n;
  }
}

function formatCollateral(value: bigint): string {
  const n = Number(formatUnits(value, POLYMARKET_COLLATERAL_DECIMALS));
  if (!Number.isFinite(n)) return '0.00';
  return n.toFixed(2);
}
