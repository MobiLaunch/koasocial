const startConversation = async (otherUser: UserResult) => {
  if (!profile) return;

  setCreating(true);
  try {
    // 1. Improved check for existing 1-on-1 conversation
    // This finds a conversation where BOTH users are participants
    const { data: existingConvo, error: searchError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", profile.id)
      .filter(
        "conversation_id",
        "in",
        supabase.from("conversation_participants").select("conversation_id").eq("profile_id", otherUser.id),
      );

    // Note: The above syntax is tricky in JS. A simpler way is:
    const { data: myConvos } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", profile.id);

    const myIds = myConvos?.map((c) => c.conversation_id) || [];

    const { data: sharedConvo } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", otherUser.id)
      .in("conversation_id", myIds)
      .maybeSingle();

    if (sharedConvo) {
      onConversationCreated(sharedConvo.conversation_id);
      onClose(); // Close modal on success
      return;
    }

    // 2. Create new conversation
    const { data: newConvo, error: convoError } = await supabase
      .from("conversations")
      .insert({}) // Ensure your DB allows empty inserts for ID generation
      .select()
      .single();

    if (convoError) throw convoError;

    // 3. Add participants
    const { error: partError } = await supabase.from("conversation_participants").insert([
      { conversation_id: newConvo.id, profile_id: profile.id },
      { conversation_id: newConvo.id, profile_id: otherUser.id },
    ]);

    if (partError) throw partError;

    onConversationCreated(newConvo.id);
    onClose();
  } catch (error: any) {
    console.error("Detailed messaging error:", error);
    toast({
      title: "Messaging Error",
      description: error.message || "Check your database RLS policies.",
      variant: "destructive",
    });
  } finally {
    setCreating(false);
  }
};
