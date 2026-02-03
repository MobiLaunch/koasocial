CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_user_id UUID,
  p_target_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_conversation_id UUID;
  new_conversation_id UUID;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'p_user_id must match authenticated user';
  END IF;

  SELECT cp1.conversation_id
  INTO existing_conversation_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.profile_id = p_user_id
    AND cp2.profile_id = p_target_id
  LIMIT 1;

  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  INSERT INTO conversations DEFAULT VALUES
  RETURNING id INTO new_conversation_id;

  INSERT INTO conversation_participants (conversation_id, profile_id)
  VALUES (new_conversation_id, p_user_id),
         (new_conversation_id, p_target_id);

  RETURN new_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_or_create_conversation(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_conversation(UUID, UUID) TO authenticated;
