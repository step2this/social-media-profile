import React, { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const UserSwitcher: React.FC = () => {
  const { currentUser, availableUsers, switchUser } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentUser) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="flex items-center gap-2 px-3 py-2 h-auto"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
          <User className="w-4 h-4 text-primary/70" />
        </div>
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium">{currentUser.displayName}</span>
          <span className="text-xs text-muted-foreground">@{currentUser.username}</span>
        </div>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform duration-200",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card className="absolute top-full left-0 mt-2 w-64 z-20 shadow-lg">
            <CardContent className="p-2">
              <div className="space-y-1">
                {availableUsers.map((user) => (
                  <Button
                    key={user.userId}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 p-3 h-auto",
                      currentUser.userId === user.userId && "bg-primary/5"
                    )}
                    onClick={() => {
                      switchUser(user.userId);
                      setIsOpen(false);
                    }}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20">
                      <User className="w-4 h-4 text-primary/70" />
                    </div>
                    <div className="flex-1 flex flex-col items-start">
                      <span className="text-sm font-medium">{user.displayName}</span>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                    {currentUser.userId === user.userId && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </Button>
                ))}
              </div>
              <div className="border-t border-border mt-2 pt-2">
                <div className="text-xs text-muted-foreground px-3 py-1">
                  Switch between demo users to test social features
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};