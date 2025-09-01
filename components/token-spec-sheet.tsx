"use client"

import { Copy } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import type { TokenSpec } from "@/lib/types"

interface TokenSpecSheetProps {
  rows: TokenSpec[]
}

export function TokenSpecSheet({ rows }: TokenSpecSheetProps) {
  const { toast } = useToast()

  const handleCopy = (value: string) => {
    navigator.clipboard.writeText(value)
    toast({
      title: "Copied to clipboard",
      description: "Address copied successfully",
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Token Info</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-0">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between p-3 border-b border-border last:border-b-0">
              <span className="text-sm text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-2">
                {row.type === "address" ? (
                  <>
                    <span className="text-sm font-mono">{row.valueShort}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(row.copyValue || "")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <span className="text-sm">{row.value}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
