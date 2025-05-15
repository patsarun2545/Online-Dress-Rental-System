import BackOffice from "../components/BackOffice";

function Contact() {
  return (
    <BackOffice>
      <div className="container-lg py-4 mt-3">
        <div
          className="card shadow-lg border-0 rounded-4 mx-auto"
          style={{
            maxWidth: "800px",
            background: "#ffffff",
            padding: "2rem",
          }}
        >
          <h3 className="text-center fw-bold text-primary mb-3">ติดต่อเรา</h3>
          <p className="text-center text-muted">
            ช่องทางติดต่อเราผ่านโซเชียลมีเดีย
          </p>

          <hr/>

          {/* Social Media Section */}
          <div className="text-center mb-3">
            <h5 className="text-secondary mb-4">ติดตามเราบนโซเชียลมีเดีย</h5>
            <div className="d-flex justify-content-center gap-4">
              <a
                href="https://www.instagram.com/chicborrow/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-light border shadow-sm d-flex align-items-center justify-content-center"
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  fontSize: "1.5rem",
                  color: "#E4405F",
                }}
              >
                <i className="fab fa-instagram"></i>
              </a>
            </div>
          </div>

          <hr/>
        </div>
      </div>
    </BackOffice>
  );
}

export default Contact;
