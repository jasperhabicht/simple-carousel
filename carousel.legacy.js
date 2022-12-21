/* helper functions to select next item in carousel */
const getNextItem = (carouselWrapper) => {
  const currentItem = carouselWrapper.querySelector('.active');
  currentItem.classList.remove('active');
  currentItem.nextSibling.classList.add('active');
  centerActiveItem(carouselWrapper);
  /* handle last item: jump to start after animation */
  window.setTimeout(() => {
    if (currentItem.nextSibling.classList.contains('cloned')) {
      currentItem.nextSibling.classList.remove('active');
      carouselWrapper.querySelectorAll('.item')[5].classList.add('active');
      centerActiveItem(carouselWrapper, false);
    }
  }, 550);
}

/* helper functions to select previous item in carousel */
const getPrevItem = (carouselWrapper) => {
  const currentItem = carouselWrapper.querySelector('.active');
  currentItem.classList.remove('active');
  currentItem.previousSibling.classList.add('active');
  centerActiveItem(carouselWrapper);
  /* handle frist item: jump to end after animation */
  window.setTimeout(() => {
    if (currentItem.previousSibling.classList.contains('cloned')) {
      currentItem.previousSibling.classList.remove('active');
      carouselWrapper.querySelectorAll('.item')[carouselWrapper.querySelectorAll('.item').length - 6].classList.add('active');
      centerActiveItem(carouselWrapper, false);
    }
  }, 550);
}

/* helper functions to center active item in carousel */
const centerActiveItem = (carouselWrapper, animate = true) => {
  const currentItem = carouselWrapper.querySelector('.active');
  const currentItemOffset = carouselWrapper.closest('.carousel').offsetWidth / 2 - currentItem.offsetLeft - currentItem.offsetWidth / 2;
  /* skip transition (relevant CSS class is needed) */
  if (animate === false) {
    carouselWrapper.classList.add('skip-transition');
  }
  carouselWrapper.style.transform = 'translateX(' + parseInt(currentItemOffset) + 'px)';
  /* force paint reflow */
  void carouselWrapper.offsetWidth;
  if (animate === false) {
    carouselWrapper.classList.remove('skip-transition');
  }
}

/* helper functions for touch events */
let touchMoveStartX = null;
let touchMoveStartY = null;
const touchUnifyMove = (event) => {
  return event.changedTouches ? event.changedTouches[0] : event;
};
const touchRecordPos = (event) => {
  touchMoveStartX = touchUnifyMove(event).clientX;
  touchMoveStartY = touchUnifyMove(event).clientY;
};
const touchRecordMove = (event, container) => {
  let touchDistanceX = 0;
  let touchDistanceY = 0;
  let touchError = 100;
  if (touchMoveStartX || touchMoveStartX === 0) {
    touchDistanceX = touchUnifyMove(event).clientX - touchMoveStartX;
    touchMoveStartX = null;
  }
  if (touchMoveStartY || touchMoveStartY === 0) {
    touchDistanceY = touchUnifyMove(event).clientY - touchMoveStartY;
    touchMoveStartY = null;
  }
  if (Math.sign(touchDistanceX) < 0 && touchDistanceY < touchError && touchDistanceY > (-1 * touchError)) {
    getNextItem(container);
    return true;
  }
  if (Math.sign(touchDistanceX) > 0 && touchDistanceY < touchError && touchDistanceY > (-1 * touchError)) {
    getPrevItem(container);
    return true;
  }
  return false;
};

const imagesLoadedEvent = (carouselWrapper, imagesArray) => {
  let visibleImagesloading = Array(imagesArray.length).fill(1);
  for (let i = 0; i < imagesArray.length; i += 1){
    imagesArray[i].addEventListener('load', () => {
      visibleImagesloading[i] = 0;
      if(visibleImagesloading.reduce((a, b) => a + b, 0) == 0) {
        carouselWrapper.closest('.carousel').classList.remove('loading');
        return true;
      }
    }, {once : true});
    if(imagesArray[i].complete) {
      imagesArray[i].load();
    }
  }
}

/* sandboxing to prevent leakage of function assignments */
(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const allCarousels = document.querySelectorAll('.carousel');
    for (let i = 0; i < allCarousels.length; i += 1) {
      const currentCarousel = allCarousels[i];
      new Promise((resolve, reject) => {
        /* wrap all items in carousel */
        const carouselItemWrapper = document.createElement('div');
        carouselItemWrapper.classList.add('wrapper');
        currentCarousel.appendChild(carouselItemWrapper);
        for (let j = currentCarousel.querySelectorAll('.item').length - 1; j >= 0; j -= 1) {
          if (j == 0) {
            allCarousels[i].querySelectorAll('.item')[j].classList.add('active');
          }
          carouselItemWrapper.insertAdjacentElement('afterbegin', allCarousels[i].querySelectorAll('.item')[j]);
        }
        resolve(carouselItemWrapper);
      }).then((carouselItemWrapper) => {
        /* add five items before and after carousel by cloning head and tail respectively */
        const carouselItemsCount = carouselItemWrapper.querySelectorAll('.item').length;
        for (let i = carouselItemsCount - 1; i > carouselItemsCount - 6; i -= 1) {
          const clonedItem = carouselItemWrapper.querySelectorAll('.item')[carouselItemsCount - 1].cloneNode(true);
          clonedItem.classList.remove('active');
          clonedItem.classList.add('cloned');
          clonedItem.classList.add('before');
          carouselItemWrapper.insertAdjacentElement('afterBegin', clonedItem);
        }
        for (let i = 5; i < 10; i += 1) {
          const clonedItem = carouselItemWrapper.querySelectorAll('.item')[i].cloneNode(true);
          clonedItem.classList.remove('active');
          clonedItem.classList.add('cloned');
          clonedItem.classList.add('after');
          carouselItemWrapper.insertAdjacentElement('beforeEnd', clonedItem);
        }
        /* append event handler that fires if first 5 images are loaded */
        let visibleItemImages = [];
        for (let i = 0; i < 5; i += 1) {
          visibleItemImages.push(currentCarousel.querySelectorAll('.item img')[i]);
        }
        imagesLoadedEvent(carouselItemWrapper, visibleItemImages);        
        return carouselItemWrapper;
      }).then((carouselItemWrapper) => {
        /* add mouse navigation to carousel */
        const carouselNavigation = document.createElement('div');
        carouselNavigation.classList.add('nav');
        const carouselButtonPrev = document.createElement('div');
        carouselButtonPrev.classList.add('prev');
        carouselButtonPrev.textContent = '\u25C0'; /* '\uF053'; */
        carouselButtonPrev.addEventListener('click', () => {
          getPrevItem(carouselItemWrapper);
        });
        const carouselButtonNext = document.createElement('div');
        carouselButtonNext.classList.add('next');
        carouselButtonNext.textContent = '\u25B6'; /* '\uF054'; */
        carouselButtonNext.addEventListener('click', () => {
          getNextItem(carouselItemWrapper);
        });
        carouselNavigation.appendChild(carouselButtonPrev);
        carouselNavigation.appendChild(carouselButtonNext);
        currentCarousel.appendChild(carouselNavigation);
        /* add touch navigation to carousel */
        currentCarousel.addEventListener('touchstart', (event) => {
          touchRecordPos(event);
        }, { passive: true }, false);
        currentCarousel.addEventListener('touchend', (event) => {
          touchRecordMove(event, carouselItemWrapper);
        }, { passive: true }, false);
      }).catch((error) => {
        console.log(error);
        return Promise.reject(error);
      });
    }
  });

  /* align carousel after all images have been loaded */
  window.addEventListener('load', () => {
    const allCarousels = document.querySelectorAll('.carousel');
    for (let i = 0; i < allCarousels.length; i += 1) {
      centerActiveItem(allCarousels[i].querySelector('.wrapper'));
    }
  });

  /* update alignment after window resize (wrap in timeout to prevent bubbling) */
  let resizeTimeout = false;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const allCarousels = document.querySelectorAll('.carousel');
      for (let i = 0; i < allCarousels.length; i += 1) {
        centerActiveItem(allCarousels[i].querySelector('.wrapper'), false);
      }
    }, 250);
  }, false);
})();