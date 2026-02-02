import React from 'react';
import { Link } from 'react-router-dom';

const SearchPage = ({ results }) => {
  return (
    <div>
      <h1>Search Results</h1>
      <ul>
        {results.map(user => (
          <li key={user.id}>
            <Link to={`/@${user.username}`}>{user.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SearchPage;