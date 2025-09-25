import React from 'react';

const FooterAdmin = () => {
  return (
    <footer className="pc-footer">
      <div className="footer-wrapper container-fluid">
        <div className="row">
          <div className="col-sm my-1">
            <p className="m-0">
              Snapflow Monitoring - Developpé par <span> </span> 
              <a 
                href="https://www.medianet.tn/"
                target="_blank"
                rel="noopener noreferrer"
              >
                   MEDIANET
              </a>
              {/* {' '}Distributed by{' '}
              <a 
                href="https://themewagon.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                ThemeWagon
              </a> */}
              
            </p>
          </div>
          <div className="col-auto my-1">
            {/* <ul className="list-inline footer-link mb-0">
              <li className="list-inline-item">
                <a href="../index.html">Home</a>
              </li>
            </ul> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterAdmin;