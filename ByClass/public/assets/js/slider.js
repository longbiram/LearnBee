
 const container = document.querySelector('#slide-grid')

 let isDown = false
 let startX
 let scrollLeft

 container.addEventListener('mousedown', (e) => {
   isDown = true
   container.classList.add('active')
   container.classList.add('no-select') // Prevent text selection
   startX = e.pageX - container.offsetLeft
   scrollLeft = container.scrollLeft
 })

 container.addEventListener('mouseleave', () => {
   isDown = false
   container.classList.remove('active')
   container.classList.remove('no-select') // Re-enable text selection
 })

 container.addEventListener('mouseup', () => {
   isDown = false
   container.classList.remove('active')
   container.classList.remove('no-select') // Re-enable text selection
 })

 container.addEventListener('mousemove', (e) => {
   if (!isDown) return
   e.preventDefault()
   const x = e.pageX - container.offsetLeft
   const walk = (x - startX) * 2 // scroll speed
   container.scrollLeft = scrollLeft - walk
 })


 

 
  const scrollLeftButton = document.getElementById('scroll-left');
  const scrollRightButton = document.getElementById('scroll-right');
  const slider = document.getElementById('slide-grid');

  // Scroll left
  scrollLeftButton.addEventListener('click', () => {
    slider.scrollBy({
      left: -400, // Scroll by the width of one item (or any value you prefer)
      behavior: 'smooth' // Smooth scrolling
    });
  });

  // Scroll right
  scrollRightButton.addEventListener('click', () => {
    slider.scrollBy({
      left: 400, // Scroll by the width of one item (or any value you prefer)
      behavior: 'smooth' // Smooth scrolling
    });
  });