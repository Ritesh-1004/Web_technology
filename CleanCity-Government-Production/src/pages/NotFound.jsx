import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container notfound">
      <div className="big">404</div>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}
