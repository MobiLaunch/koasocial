import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
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
    <div className="container max-w-2xl py-6 animate-in fade-in duration-500">
      <h1 className="text-xl font-bold px-4 mb-4">Search</h1>

      <div className="relative px-4 mb-6">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-12 bg-secondary/50 border-none rounded-full h-12 focus-visible:ring-1 ring-primary"
          placeholder="Search for people..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="space-y-1">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
          results.map((user) => (
            <Link
              key={user.id}
              to={`/@${user.username}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/30 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                  {user.display_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-bold leading-tight hover:underline">{user.display_name || user.username}</span>
                <span className="text-muted-foreground text-sm">@{user.username}</span>
              </div>
            </Link>
          ))
        ) : searchQuery.length >= 2 ? (
          <div className="text-center py-10 text-muted-foreground">No results for "{searchQuery}"</div>
        ) : (
          <div className="text-center py-10 text-muted-foreground italic">Try searching for a name or @username</div>
        )}
      </div>
    </div>
  );
};

// This line is the fix for the "does not provide an export named default" error
export default SearchPage;
