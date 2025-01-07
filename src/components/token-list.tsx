"use client";

import { fetchApi } from "@/lib/api-client";
import { UserToken } from "@/lib/token-utils";
import { useState } from "react";

interface TokenListProps {
    initialTokens?: UserToken[];
}

export function TokenList({ initialTokens = [] }: TokenListProps) {
    const [tokens, setTokens] = useState<UserToken[]>(initialTokens);
    const [newTokenName, setNewTokenName] = useState("");
    const [newToken, setNewToken] = useState<{ token: string; id: string } | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);

    const createToken = async () => {
        if (!newTokenName.trim()) {
            setError("Token name is required");
            return;
        }

        const { data, error } = await fetchApi<{ token: string; id: string }>(
            "/api/tokens",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTokenName.trim() }),
            }
        );

        if (error) {
            setError(error.message);
            return;
        }

        if (data) {
            setNewToken(data);
            // Refresh token list
            const { data: tokens } = await fetchApi<UserToken[]>("/api/tokens");
            if (tokens) {
                setTokens(tokens);
            }
            setNewTokenName("");
        }
    };

    const revokeToken = async (id: string) => {
        const { error } = await fetchApi(`/api/tokens/${id}`, {
            method: "DELETE",
        });

        if (error) {
            setError(error.message);
            return;
        }

        // Refresh token list
        const { data: tokens } = await fetchApi<UserToken[]>("/api/tokens");
        if (tokens) {
            setTokens(tokens);
        }
    };

    const formatDate = (timestamp?: number) => {
        if (!timestamp) return "Never";
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <div className="space-y-6">
            {/* Create new token */}
            <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Create New Token</h3>
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="tokenName"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Token Name
                        </label>
                        <div className="mt-1 flex gap-4">
                            <input
                                type="text"
                                id="tokenName"
                                value={newTokenName}
                                onChange={(e) => setNewTokenName(e.target.value)}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                                placeholder="e.g. CI/CD Pipeline"
                            />
                            <button
                                onClick={createToken}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Create Token
                            </button>
                        </div>
                    </div>

                    {/* Show new token */}
                    {newToken && (
                        <div className="rounded-md bg-blue-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-blue-800">
                                        New Token Created
                                    </h3>
                                    <div className="mt-2 text-sm text-blue-700">
                                        <p className="font-mono break-all">{newToken.token}</p>
                                        <p className="mt-2 text-blue-800 font-medium">
                                            Make sure to copy this token now. You won't be able to see it
                                            again!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Show error */}
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{error}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Token list */}
            <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium mb-4">Your Tokens</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Created
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Last Used
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50"></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tokens.map((token) => (
                                    <tr key={token.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {token.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(token.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(token.last_used_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {token.revoked_at ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                    Revoked
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Active
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {!token.revoked_at && (
                                                <button
                                                    onClick={() => revokeToken(token.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {tokens.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-4 text-sm text-gray-500 text-center"
                                        >
                                            No tokens found. Create one above to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}