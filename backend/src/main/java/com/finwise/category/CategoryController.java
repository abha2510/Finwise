package com.finwise.category;

import com.finwise.auth.CurrentUser;
import com.finwise.common.NotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    public record CategoryRequest(
            @NotBlank @Size(max = 80) String name,
            @NotNull Category.Type type) {}

    public record CategoryResponse(Long id, String name, Category.Type type, boolean isDefault) {
        static CategoryResponse from(Category c) {
            return new CategoryResponse(c.getId(), c.getName(), c.getType(), c.getUserId() == null);
        }
    }

    private final CategoryRepository categories;
    private final CurrentUser currentUser;

    public CategoryController(CategoryRepository categories, CurrentUser currentUser) {
        this.categories = categories;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<CategoryResponse> list() {
        return categories.findVisibleTo(currentUser.id()).stream().map(CategoryResponse::from).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CategoryResponse create(@Valid @RequestBody CategoryRequest req) {
        return CategoryResponse.from(
                categories.save(new Category(currentUser.id(), req.name().trim(), req.type())));
    }

    @PutMapping("/{id}")
    @Transactional
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest req) {
        Category category = categories.findByIdAndUserId(id, currentUser.id())
                .orElseThrow(() -> new NotFoundException("Category not found"));
        category.setName(req.name().trim());
        category.setType(req.type());
        return CategoryResponse.from(category);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable Long id) {
        Category category = categories.findByIdAndUserId(id, currentUser.id())
                .orElseThrow(() -> new NotFoundException("Category not found"));
        categories.delete(category); // transactions fall back to "Needs review" (ON DELETE SET NULL)
    }
}
