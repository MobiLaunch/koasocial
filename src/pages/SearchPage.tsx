import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Standard Twitter-like search: find by username or display name
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url")
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header - M3 Expressive style */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="px-5 py-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-headline-medium text-foreground">Search</h1>
          </div>

          {/* Search input - M3 style */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              className="pl-12 h-12 bg-surface-container border-2 border-transparent rounded-2xl focus:border-primary focus:bg-background transition-all duration-200 text-base"
              placeholder="Search for people..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Results */}
      <div className="divide-y divide-border/50">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground font-medium">Searching...</p>
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            <Link
              key={user.id}
              to={`/u/${user.username}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-surface-container transition-all duration-200 group"
            >
              <Avatar className="h-12 w-12 ring-2 ring-background shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {user.display_name || user.username}
                </span>
                <span className="text-muted-foreground text-sm">@{user.username}</span>
              </div>
            </Link>
          ))
        ) : searchQuery.length >= 2 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-surface-container-high flex items-center justify-center">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No results for "{searchQuery}"</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-20 w-20 rounded-3xl bg-surface-container-high flex items-center justify-center">
              <Search className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-lg font-semibold text-foreground">Find people</p>
            <p className="text-muted-foreground">Try searching for a name or @username</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;