import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";

export function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) return setResults([]);

    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url")
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    setResults(data || []);
  };

  return (
    <div className="container max-w-2xl py-8">
      <h1 className="text-2xl font-bold mb-6">Search</h1>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {results.map((user) => (
          <Link
            key={user.id}
            to={`/profile/${user.username}`}
            className="flex items-center gap-3 p-3 hover:bg-accent rounded-xl transition-colors"
          >
            <Avatar className="h-12 w-12">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.display_name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-bold">{user.display_name}</div>
              <div className="text-sm text-muted-foreground">@{user.username}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Crucial: Default export for the router
export default SearchPage;
