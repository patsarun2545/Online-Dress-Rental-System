import { useState, useEffect } from "react";
import BackOffice from "../components/BackOffice";
import Swal from "sweetalert2"; // Import Swal for notifications
import config from "../config";
import "./Home.css";
import { Link } from "react-router-dom";

function Heart() {
  const [heart, setHeart] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    // Load heart data from localStorage
    const savedHeart = JSON.parse(localStorage.getItem("heart")) || [];
    setHeart(savedHeart);

    // Load cart data from localStorage
    const savedCart = JSON.parse(localStorage.getItem("carts")) || [];
    setCart(savedCart);
  }, []);

  const toggleHeart = (index) => {
    const updatedHeart = [...heart];
    updatedHeart.splice(index, 1); // Remove the item at the specified index
    setHeart(updatedHeart); // Update the state
    localStorage.setItem("heart", JSON.stringify(updatedHeart)); // Update localStorage
  };

  const addToCart = (item) => {
    const isAlreadyInCart = cart.some((cartItem) => cartItem.id === item.id);

    if (isAlreadyInCart) {
      Swal.fire({
        title: "เตือน!",
        text: "สินค้านี้อยู่ในตะกร้าแล้ว!",
        icon: "warning",
        timer: 500,
        showConfirmButton: false,
      });
      return;
    }

    const updatedCart = [...cart, item];
    setCart(updatedCart);
    localStorage.setItem("carts", JSON.stringify(updatedCart));

    Swal.fire({
      title: "สำเร็จ!",
      text: "หยิบสินค้าเรียบร้อยแล้ว!",
      icon: "success",
      timer: 500,
      showConfirmButton: false,
    });
  };

  return (
    <BackOffice>
      <div className="container mt-5">
        {heart.length > 0 ? (
          <>
            <h4 className="ms-3">สินค้าที่ถูกใจ</h4>
            <div className="row g-0">
              {heart.map((item, index) => (
                <div
                  className="col-xxl-2 col-lg-3 col-md-4 col-sm-6"
                  key={index}
                >
                  <Link
                    to={`/product/${item.id}`}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <div className="card h-100 border-0 shadow-sm position-relative">
                      {/* Toggle heart icon */}
                      <i
                        className="fa fa-heart position-absolute text-danger"
                        style={{
                          top: "10px",
                          right: "10px",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          e.preventDefault(); // ป้องกันไม่ให้ลิงก์ทำงานเมื่อคลิกที่หัวใจ
                          toggleHeart(index);
                        }}
                      ></i>
                      <img
                        className="card-img-top"
                        height="200px"
                        src={
                          item.images && item.images[0]?.url
                            ? `${config.apiPath}/uploads/${item.images[0].url}`
                            : "default_image.jpg"
                        }
                        alt={item.name}
                      />
                      <div className="card-body d-flex flex-column justify-content-between">
                        <div className="text-center mb-3">
                          <h6 className="card-title mb-1">{item.name}</h6>
                          <p className="text-muted mb-0">
                            ฿{item.price.toLocaleString("th-TH")}
                          </p>
                        </div>
                        <div className="text-center">
                          <button
                            className="btn btn-primary w-100 d-flex align-items-center justify-content-center"
                            onClick={(e) => {
                              e.preventDefault(); // ป้องกันไม่ให้ลิงก์ทำงานเมื่อคลิกปุ่ม
                              addToCart(item);
                            }}
                          >
                            <i className="fa fa-shopping-cart me-2"></i>
                            หยิบสินค้า
                          </button>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center p-5">
            <h5 className="text-muted">ไม่มีสินค้าที่ถูกใจ</h5>
          </div>
        )}
      </div>
    </BackOffice>
  );
}

export default Heart;
