 
   function updateTime() {
    const now = new Date();

    const day = String(now.getDate()).padStart(2, '0');
    const month = now.toLocaleString("en-US", { month: "short" }); // e.g., "May"
    const year = now.getFullYear();

    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12
    hours = String(hours).padStart(2, '0');

    const formattedDate = `${day}-${month}-${year} : ${hours}:${minutes}:${seconds} ${ampm}`;

    document.getElementById("dateDisplay").value = formattedDate;
  }

  updateTime(); // Initial call
  setInterval(updateTime, 1000); // Update every second
 
 
 
 
 /*---------------------------------------------------------------------
      ProgressBar Animation
-----------------------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", function () {
  const progressBars = document.querySelectorAll(".iq-progress");

  progressBars.forEach(function (bar, index) {
    const targetPercent = parseInt(bar.getAttribute("data-percent"), 10) || 0;
    const label = bar.parentElement.querySelector(".iq-progress-label");

    const delay = index * 300;

    setTimeout(() => {
      bar.style.width = targetPercent + "%";

      if (!label) return; // If label doesn't exist, skip the counting animation

      let count = 0;
      const duration = 1500;
      const interval = 15;
      const increment = targetPercent / (duration / interval);

      const counter = setInterval(() => {
        count += increment;
        if (count >= targetPercent) {
          count = targetPercent;
          clearInterval(counter);
        }
        label.textContent = Math.round(count) + "%";
      }, interval);
    }, delay);
  });
});



/*---------------------------------------------------------------------
      Number Counter Animation
-----------------------------------------------------------------------*/
  document.addEventListener("DOMContentLoaded", function () {
    const counters = document.querySelectorAll('.counter');

    const animateCount = (el, target) => {
      let count = 0;
      const duration = 1000;
      const steps = 60;
      const increment = target / steps;
      const interval = duration / steps;

      const update = () => {
        count += increment;
        if (count >= target) {
          el.textContent = target.toLocaleString('en-IN');
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(count).toLocaleString('en-IN');
        }
      };

      const timer = setInterval(update, interval);
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseInt(el.textContent.replace(/,/g, ''), 10);
          animateCount(el, target);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.6 });

    counters.forEach(counter => observer.observe(counter));
  });









/*---------------------------------------------------------------------
    Side NavBar
-----------------------------------------------------------------------*/
window.addEventListener("scroll", function() {
  const navbar = document.querySelector(".iq-top-navbar");
  const whiteMenu = document.querySelector(".white-bg-menu");
  
  if (window.scrollY > 0) {
    navbar?.classList.add("fixed");
    whiteMenu?.classList.add("sticky-menu");
  } else {
    navbar?.classList.remove("fixed");
    whiteMenu?.classList.remove("sticky-menu");
  }
});

document.addEventListener("click", function(e) {
  if (e.target.closest(".wrapper-menu")) {
    const wrapper = e.target.closest(".wrapper-menu");
    wrapper.classList.toggle("open");
    document.body.classList.toggle("sidebar-main");
  }

  if (e.target.closest(".close-toggle")) {
    const collapseEl = document.querySelector(".h-collapse.navbar-collapse");
    if (collapseEl) {
      const bsCollapse = bootstrap.Collapse.getInstance(collapseEl) || new bootstrap.Collapse(collapseEl);
      bsCollapse.hide();
    }
  }

  if (e.target.closest(".iq-menu > li > a")) {
    const menuItem = e.target.closest(".iq-menu > li");
    document.querySelectorAll(".iq-menu > li").forEach(el => {
      el.classList.remove("active");
    });
    menuItem.classList.add("active");
  }
});

function initializeActiveMenu() {
  document.querySelectorAll("li.active").forEach(el => {
    const submenu = el.closest(".iq-submenu.collapse");
    if (submenu) {
      submenu.classList.add("show");
      submenu.closest("li").classList.add("active");
    }
    
    // Corrected selector: removed leading '>'
    const link = el.querySelector('a[aria-expanded="false"]');
    if (link) {
      link.setAttribute("aria-expanded", "true");
    }
  });
}


document.addEventListener("DOMContentLoaded", function() {
  initializeActiveMenu();
});


document.addEventListener("click", function(e) {
  const userToggle = document.querySelector(".iq-user-toggle");
  if (!userToggle) return; // <-- stop if element not found

  if (e.target.closest(".iq-user-toggle")) {
    userToggle.parentElement.classList.toggle("show-data");
  }

  if (e.target.closest(".close-data")) {
    userToggle.parentElement.classList.remove("show-data");
  }

  if (
    !e.target.closest(".iq-user-toggle") &&
    !e.target.closest(".iq-user-toggle ~ *") &&
    userToggle.parentElement.classList.contains("show-data")
  ) {
    userToggle.parentElement.classList.remove("show-data");
  }
});


window.addEventListener("scroll", function() {
  const userToggle = document.querySelector(".iq-user-toggle");
  if (window.scrollY >= 10 && userToggle?.parentElement.classList.contains("show-data")) {
    userToggle.parentElement.classList.remove("show-data");
  }
});



document.addEventListener("click", function(e) {
  if (e.target.closest(".iq-menu-bt-sidebar")) {
    document.body.classList.remove("sidebar-main");
        const wrapperMenu = document.querySelector(".wrapper-menu");
    if (wrapperMenu) {
      wrapperMenu.classList.remove("open");
    }
  }
});




/*---------------------------------------------------------------------
  Collapsable 
-----------------------------------------------------------------------*/


document.querySelectorAll('.collapse-item').forEach((item) => {
  const summary = item.querySelector('.collapse-toggle');
  const content = item.querySelector('.collapse-menu');

  // If default open, set height and attribute immediately
  if (item.classList.contains('default-open')) {
    item.setAttribute('open', '');
    content.style.height = content.scrollHeight + 'px';

    // Once opened, switch to auto after a tick to prevent animation issues
    requestAnimationFrame(() => {
      content.style.height = 'auto';
    });
  }

  summary.addEventListener('click', (e) => {
    e.preventDefault();

    const isOpen = item.hasAttribute('open');

    if (isOpen) {
      content.style.height = content.scrollHeight + 'px';
      requestAnimationFrame(() => {
        content.style.height = '0';
      });
      item.removeAttribute('open');
    } else {
      item.setAttribute('open', '');
      content.style.height = '0';
      requestAnimationFrame(() => {
        content.style.height = content.scrollHeight + 'px';
      });
    }
  });

  content.addEventListener('transitionend', () => {
    if (item.hasAttribute('open')) {
      content.style.height = 'auto';
    }
  });
});




/*---------------------------------------------------------------------
Top Navigation Functionality
-----------------------------------------------------------------------*/

function initTopNavigation() {
  const topNavbar = document.querySelector('.iq-top-navbar');
  const whiteBgMenu = document.querySelector('.white-bg-menu');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
      topNavbar?.classList.add('fixed');
      whiteBgMenu?.classList.add('sticky-menu');
    } else {
      topNavbar?.classList.remove('fixed');
      whiteBgMenu?.classList.remove('sticky-menu');
    }
  });

  const navbarToggler = document.querySelector('.navbar-toggler');
  const navbarCollapse = document.querySelector('.navbar-collapse');

  if (navbarToggler && navbarCollapse) {
    navbarToggler.addEventListener('click', () => {
      navbarCollapse.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
      if (!navbarToggler.contains(e.target) && !navbarCollapse.contains(e.target)) {
        navbarCollapse.classList.remove('show');
      }
    });
  }

  const closeToggle = document.querySelector('.close-toggle');
  if (closeToggle) {
    closeToggle.addEventListener('click', () => {
      navbarCollapse?.classList.remove('show');
    });
  }
}

function initSideNavigation() {
  const wrapperMenu = document.querySelector('.wrapper-menu');
  
  if (wrapperMenu) {
    wrapperMenu.addEventListener('click', () => {
      wrapperMenu.classList.toggle('open');
      document.body.classList.toggle('sidebar-main');
    });
  }

  document.addEventListener('click', (e) => {
    const menuLink = e.target.closest('.iq-menu > li > a');
    if (menuLink) {
      const menuItem = menuLink.parentElement;
      
      document.querySelectorAll('.iq-menu > li').forEach(item => {
        item.classList.remove('active');
      });
      
      menuItem.classList.add('active');
    }
  });

function initActiveMenu() {
  document.querySelectorAll('li.active').forEach(activeItem => {
    const submenu = activeItem.closest('.iq-submenu.collapse');
    if (submenu) {
      submenu.classList.add('show');
      submenu.closest('li').classList.add('active');
    }

    // Fix here:
    const link = Array.from(activeItem.children).find(
      el => el.tagName === 'A' && el.getAttribute('aria-expanded') === 'false'
    );

    if (link) {
      link.setAttribute('aria-expanded', 'true');
    }
  });
}


  const chatStart = document.getElementById('chat-start');
  const chatDataLeft = document.querySelector('.chat-data-left');
  const closeBtnRes = document.querySelector('.close-btn-res');
  
  if (chatStart && chatDataLeft) {
    chatStart.addEventListener('click', () => {
      chatDataLeft.classList.toggle('show');
    });
  }
  
  if (closeBtnRes && chatDataLeft) {
    closeBtnRes.addEventListener('click', () => {
      chatDataLeft.classList.remove('show');
    });
  }

  initActiveMenu();
}

function initUserProfile() {
  const userToggle = document.querySelector('.iq-user-toggle');
  const closeData = document.querySelector('.close-data');

  if (userToggle) {
    userToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      userToggle.parentElement.classList.toggle('show-data');
    });

    document.addEventListener('click', (e) => {
      if (!userToggle.contains(e.target) && 
          !userToggle.parentElement.querySelector('.show-data')?.contains(e.target)) {
        userToggle.parentElement.classList.remove('show-data');
      }
    });
  }

  if (closeData) {
    closeData.addEventListener('click', () => {
      userToggle?.parentElement.classList.remove('show-data');
    });
  }

  window.addEventListener('scroll', () => {
    if (window.scrollY >= 10 && userToggle?.parentElement.classList.contains('show-data')) {
      userToggle.parentElement.classList.remove('show-data');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initTopNavigation();
  initSideNavigation();
  initUserProfile();
});







document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.dropdown-toggle').forEach(function (toggle) {
    const dropdownMenu = toggle.closest('.dropdown').querySelector('.dropdown-menu');

    // Toggle visibility on click
    toggle.addEventListener('click', function (e) {
      e.preventDefault();

      // Close all other dropdowns (optional)
      document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        if (menu !== dropdownMenu) menu.classList.remove('show');
      });

      dropdownMenu.classList.toggle('show');
    });

    // Close when clicking outside
    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !dropdownMenu.contains(e.target)) {
        dropdownMenu.classList.remove('show');
      }
    });
  });
});
