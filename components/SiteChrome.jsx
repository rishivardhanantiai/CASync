export function SiteHeader({ title = "Total Tax Hub" }) {
  return (
    <header className="header">
      <div className="container">
        <h1>{title}</h1>
        <div className="contact-info">
          <p>
            <i className="fas fa-envelope" /> btpitsolution@gmail.com
          </p>
          <p>
            <i className="fas fa-phone" /> 9414973521
          </p>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ text = "\u00a9 2025 Total Tax Hub. All rights reserved." }) {
  return (
    <footer className="footer">
      <div className="container">
        <p>{text}</p>
      </div>
    </footer>
  );
}
