import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Target, Zap } from 'lucide-react';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useAllAssets } from '@/hooks/useAllAssets';

interface AssetSearchModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AssetSearchModal({ open, onOpenChange }: AssetSearchModalProps) {
    const navigate = useNavigate();
    const { assets, loading } = useAllAssets();

    const handleSelect = (ticker: string, type: string) => {
        onOpenChange(false);
        navigate(`/scanner/${type}/${encodeURIComponent(ticker)}`);
    };

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Search stocks or crypto to add a tip..." />
            <CommandList className="max-h-[70vh]">
                <CommandEmpty>No results found for that ticker.</CommandEmpty>

                {loading && (
                    <CommandGroup heading="Markets">
                        <CommandItem disabled className="justify-center py-8">
                            <Zap className="w-5 h-5 animate-pulse text-primary mr-2" />
                            Scanning markets...
                        </CommandItem>
                    </CommandGroup>
                )}

                {!loading && assets.length > 0 && (
                    <>
                        <CommandGroup heading="Cryptocurrencies">
                            {assets.filter(a => a.type === 'crypto').map(asset => (
                                <CommandItem
                                    key={`crypto-${asset.ticker}`}
                                    onSelect={() => handleSelect(asset.ticker, 'crypto')}
                                    className="flex justify-between items-center py-3 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center border border-accent/20">
                                            <Target className="w-4 h-4 text-accent" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm">{asset.ticker}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Digital Asset</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[8px] border-accent/30 text-accent">CRYPTO</Badge>
                                        <span className="font-mono text-xs font-bold">${asset.price.toLocaleString()}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>

                        <CommandGroup heading="Stocks">
                            {assets.filter(a => a.type === 'stocks').map(asset => (
                                <CommandItem
                                    key={`stock-${asset.ticker}`}
                                    onSelect={() => handleSelect(asset.ticker, 'stocks')}
                                    className="flex justify-between items-center py-3 cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                            <TrendingUp className="w-4 h-4 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-sm">{asset.ticker}</span>
                                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">US Market Equity</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[8px] border-primary/30 text-primary">STOCK</Badge>
                                        <span className="font-mono text-xs font-bold">${asset.price.toLocaleString()}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    );
}
